import { apiRequest } from './http';

export interface BackendMenuNode {
  id: string;
  parentId?: string;
  nodeType: string;
  title: string;
  code: string;
  moduleType?: string;
  useflag?: number | string;
  subsysId: number;
  subsysCode?: string;
  menuId?: number;
  parentMenuId?: number;
  menuStruct?: string;
  purviewId?: string;
  enabled: boolean;
  children: BackendMenuNode[];
}

export interface BackendSubsystemNode extends BackendMenuNode {
  nodeType: 'subsystem';
  subsysId: number;
  children: BackendMenuNode[];
}

export interface SecondLevelMenuQuery {
  menuId: number;
  subsysId: number;
}

export async function fetchSubsystemMenuTree() {
  return apiRequest<BackendSubsystemNode[]>('/api/system/subsystem-menu-tree', {
    auth: true,
    method: 'GET',
  });
}

export async function fetchSubsystemSecondLevelMenus(query: SecondLevelMenuQuery) {
  return apiRequest<BackendMenuNode[]>('/api/system/subsystem-menu-second-level', {
    auth: true,
    method: 'GET',
    query: {
      menuId: query.menuId,
      subsysId: query.subsysId,
    },
  });
}
