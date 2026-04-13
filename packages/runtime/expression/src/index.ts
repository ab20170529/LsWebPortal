export type RuntimeExpressionContext = Record<string, unknown>;

type Token =
  | { type: 'boolean'; value: boolean }
  | { type: 'eof' }
  | { type: 'identifier'; value: string }
  | { type: 'null'; value: null }
  | { type: 'number'; value: number }
  | { type: 'operator'; value: string }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'string'; value: string };

type ExpressionNode =
  | {
      left: ExpressionNode;
      operator: string;
      right: ExpressionNode;
      type: 'binary';
    }
  | {
      name: string;
      type: 'identifier';
    }
  | {
      type: 'literal';
      value: boolean | null | number | string;
    }
  | {
      argument: ExpressionNode;
      operator: '!' | '-';
      type: 'unary';
    };

export function evaluatePlatformExpression(
  expression: string,
  context: RuntimeExpressionContext,
): unknown {
  const tokens = tokenizeExpression(expression);
  const parser = createParser(tokens);
  const ast = parser.parseExpression();
  parser.expectEnd();
  return evaluateNode(ast, context);
}

export function evaluateBooleanExpression(
  expression: string,
  context: RuntimeExpressionContext,
): boolean {
  return Boolean(evaluatePlatformExpression(expression, context));
}

function tokenizeExpression(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (!char) {
      break;
    }

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    const operator =
      expression.slice(index, index + 3).match(/^(===|!==)/)?.[0] ??
      expression.slice(index, index + 2).match(/^(\|\||&&|>=|<=|==|!=)/)?.[0] ??
      expression.slice(index, index + 1).match(/^([><+\-*/!()])/u)?.[0];

    if (operator) {
      if (operator === '(' || operator === ')') {
        tokens.push({ type: 'paren', value: operator });
      } else {
        tokens.push({ type: 'operator', value: operator });
      }
      index += operator.length;
      continue;
    }

    if (char === '"' || char === "'") {
      const { value, nextIndex } = readStringLiteral(expression, index, char);
      tokens.push({ type: 'string', value });
      index = nextIndex;
      continue;
    }

    if (/[0-9]/.test(char)) {
      const match = expression.slice(index).match(/^\d+(\.\d+)?/);
      if (!match) {
        throw new Error(`Invalid number at position ${index}.`);
      }

      tokens.push({ type: 'number', value: Number(match[0]) });
      index += match[0].length;
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      const match = expression.slice(index).match(/^[A-Za-z_][A-Za-z0-9_.]*/);
      if (!match) {
        throw new Error(`Invalid identifier at position ${index}.`);
      }

      const identifier = match[0];
      if (identifier === 'true' || identifier === 'false') {
        tokens.push({ type: 'boolean', value: identifier === 'true' });
      } else if (identifier === 'null') {
        tokens.push({ type: 'null', value: null });
      } else {
        tokens.push({ type: 'identifier', value: identifier });
      }

      index += identifier.length;
      continue;
    }

    throw new Error(`Unexpected token "${char}" at position ${index}.`);
  }

  tokens.push({ type: 'eof' });
  return tokens;
}

function readStringLiteral(
  expression: string,
  startIndex: number,
  quote: '"' | "'",
) {
  let index = startIndex + 1;
  let value = '';

  while (index < expression.length) {
    const char = expression[index];

    if (!char) {
      break;
    }

    if (char === '\\') {
      const nextChar = expression[index + 1];
      if (!nextChar) {
        throw new Error('Unterminated string literal.');
      }
      value += nextChar;
      index += 2;
      continue;
    }

    if (char === quote) {
      return {
        nextIndex: index + 1,
        value,
      };
    }

    value += char;
    index += 1;
  }

  throw new Error('Unterminated string literal.');
}

function createParser(tokens: Token[]) {
  let index = 0;

  const current = () => tokens[index] ?? { type: 'eof' as const };

  const consume = () => {
    const token = current();
    index += 1;
    return token;
  };

  const parsePrimary = (): ExpressionNode => {
    const token = consume();

    if (token.type === 'number' || token.type === 'string' || token.type === 'boolean') {
      return {
        type: 'literal',
        value: token.value,
      };
    }

    if (token.type === 'null') {
      return {
        type: 'literal',
        value: null,
      };
    }

    if (token.type === 'identifier') {
      return {
        name: token.value,
        type: 'identifier',
      };
    }

    if (token.type === 'paren' && token.value === '(') {
      const expressionNode = parseLogicalOr();
      const closing = consume();
      if (closing.type !== 'paren' || closing.value !== ')') {
        throw new Error('Expected closing parenthesis.');
      }
      return expressionNode;
    }

    throw new Error(`Unexpected token while parsing expression: ${JSON.stringify(token)}.`);
  };

  const parseUnary = (): ExpressionNode => {
    const token = current();
    if (token.type === 'operator' && (token.value === '!' || token.value === '-')) {
      consume();
      return {
        argument: parseUnary(),
        operator: token.value,
        type: 'unary',
      };
    }

    return parsePrimary();
  };

  const parseMultiplicative = (): ExpressionNode => {
    let node = parseUnary();

    while (true) {
      const token = current();
      if (token.type !== 'operator' || (token.value !== '*' && token.value !== '/')) {
        return node;
      }

      consume();
      node = {
        left: node,
        operator: token.value,
        right: parseUnary(),
        type: 'binary',
      };
    }
  };

  const parseAdditive = (): ExpressionNode => {
    let node = parseMultiplicative();

    while (true) {
      const token = current();
      if (token.type !== 'operator' || (token.value !== '+' && token.value !== '-')) {
        return node;
      }

      consume();
      node = {
        left: node,
        operator: token.value,
        right: parseMultiplicative(),
        type: 'binary',
      };
    }
  };

  const parseComparison = (): ExpressionNode => {
    let node = parseAdditive();

    while (true) {
      const token = current();
      if (
        token.type !== 'operator' ||
        !['>', '>=', '<', '<='].includes(token.value)
      ) {
        return node;
      }

      consume();
      node = {
        left: node,
        operator: token.value,
        right: parseAdditive(),
        type: 'binary',
      };
    }
  };

  const parseEquality = (): ExpressionNode => {
    let node = parseComparison();

    while (true) {
      const token = current();
      if (
        token.type !== 'operator' ||
        !['==', '!=', '===', '!=='].includes(token.value)
      ) {
        return node;
      }

      consume();
      node = {
        left: node,
        operator: token.value,
        right: parseComparison(),
        type: 'binary',
      };
    }
  };

  const parseLogicalAnd = (): ExpressionNode => {
    let node = parseEquality();

    while (true) {
      const token = current();
      if (token.type !== 'operator' || token.value !== '&&') {
        return node;
      }

      consume();
      node = {
        left: node,
        operator: token.value,
        right: parseEquality(),
        type: 'binary',
      };
    }
  };

  const parseLogicalOr = (): ExpressionNode => {
    let node = parseLogicalAnd();

    while (true) {
      const token = current();
      if (token.type !== 'operator' || token.value !== '||') {
        return node;
      }

      consume();
      node = {
        left: node,
        operator: token.value,
        right: parseLogicalAnd(),
        type: 'binary',
      };
    }
  };

  return {
    expectEnd() {
      if (current().type !== 'eof') {
        throw new Error('Unexpected trailing tokens in expression.');
      }
    },
    parseExpression() {
      return parseLogicalOr();
    },
  };
}

function evaluateNode(
  node: ExpressionNode,
  context: RuntimeExpressionContext,
): unknown {
  if (node.type === 'literal') {
    return node.value;
  }

  if (node.type === 'identifier') {
    return resolvePath(context, node.name);
  }

  if (node.type === 'unary') {
    const argument = evaluateNode(node.argument, context);
    return node.operator === '!' ? !Boolean(argument) : -Number(argument ?? 0);
  }

  const left = evaluateNode(node.left, context);
  const right = evaluateNode(node.right, context);

  switch (node.operator) {
    case '&&':
      return Boolean(left) && Boolean(right);
    case '||':
      return Boolean(left) || Boolean(right);
    case '==':
    case '===':
      return left === right;
    case '!=':
    case '!==':
      return left !== right;
    case '>':
      return Number(left) > Number(right);
    case '>=':
      return Number(left) >= Number(right);
    case '<':
      return Number(left) < Number(right);
    case '<=':
      return Number(left) <= Number(right);
    case '+':
      return typeof left === 'string' || typeof right === 'string'
        ? `${left ?? ''}${right ?? ''}`
        : Number(left ?? 0) + Number(right ?? 0);
    case '-':
      return Number(left ?? 0) - Number(right ?? 0);
    case '*':
      return Number(left ?? 0) * Number(right ?? 0);
    case '/':
      return Number(left ?? 0) / Number(right ?? 0);
    default:
      throw new Error(`Unsupported operator ${node.operator}.`);
  }
}

function resolvePath(source: RuntimeExpressionContext, path: string) {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, source);
}
