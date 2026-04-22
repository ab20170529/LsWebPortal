/**
 * Copyright (c) 2006-2012, JGraph Holdings Ltd
 */
Format = function(editorUi, container)
{
	this.editorUi = editorUi;
	this.container = container;
	this.collapsedSections = {};
};

/**
 * Icons for markers (24x16).
 */
Format.noMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 24 8" stroke="black" fill="black"/>', 32, 20);
Format.classicFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 10 2 L 5 8 L 10 14 Z M 0 8 L 24 8" stroke="black" fill="black"/>', 32, 20);
Format.classicThinFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 8 4 L 3 8 L 8 12 Z M 0 8 L 24 8" stroke="black" fill="black"/>', 32, 20);
Format.openFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 8 0 L 0 8 L 8 16 M 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.openThinFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 8 4 L 0 8 L 8 12 M 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.openAsyncFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 8 4 L 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.blockFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 8 2 L 8 14 Z M 0 8 L 24 8" stroke="black" fill="black"/>', 32, 20);
Format.blockThinFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 8 4 L 8 12 Z M 0 8 L 24 8" stroke="black" fill="black"/>', 32, 20);
Format.asyncFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 6 8 L 6 4 L 0 8 L 24 8" stroke="black" fill="black"/>', 32, 20);
Format.ovalFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 A 5 5 0 0 1 5 3 A 5 5 0 0 1 11 8 A 5 5 0 0 1 5 13 A 5 5 0 0 1 0 8 Z M 10 8 L 24 8" stroke="black" fill="black"/>', 32, 20);
Format.diamondFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 6 2 L 12 8 L 6 14 Z M 0 8 L 24 8" stroke="black" fill="black"/>', 32, 20);
Format.diamondThinFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 8 3 L 16 8 L 8 13 Z M 0 8 L 24 8" stroke="black" fill="black"/>', 32, 20);
Format.classicMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 10 2 L 5 8 L 10 14 Z M 5 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.classicThinMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 8 4 L 5 8 L 8 12 Z M 5 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.blockMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 8 2 L 8 14 Z M 8 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.blockThinMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 8 4 L 8 12 Z M 8 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.asyncMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 6 8 L 6 4 L 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.ovalMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 A 5 5 0 0 1 5 3 A 5 5 0 0 1 11 8 A 5 5 0 0 1 5 13 A 5 5 0 0 1 0 8 Z M 10 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.diamondMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 6 2 L 12 8 L 6 14 Z M 12 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.diamondThinMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 8 3 L 16 8 L 8 13 Z M 16 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.boxMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 3 L 10 3 L 10 13 L 0 13 Z M 10 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.halfCircleMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 3 A 5 5 0 0 1 5 8 A 5 5 0 0 1 0 13 M 5 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.dashMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 2 L 12 14 M 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.crossMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 2 L 12 14 M 12 2 L 0 14 M 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.circlePlusMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 A 6 6 0 0 1 6 2 A 6 6 0 0 1 12 8 A 6 6 0 0 1 6 14 A 6 6 0 0 1 0 8 Z M 6 2 L 6 14 M 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.circleMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 A 6 6 0 0 1 6 2 A 6 6 0 0 1 12 8 A 6 6 0 0 1 6 14 A 6 6 0 0 1 0 8 Z M 12 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.ERmandOneMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 6 2 L 6 14 M 9 2 L 9 14 M 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.ERmanyMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 2 L 12 8 L 0 14 M 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.ERoneToManyMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 2 L 12 8 L 0 14 M 15 2 L 15 14 M 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.ERzeroToOneMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 8 8 A 5 5 0 0 1 13 3 A 5 5 0 0 1 18 8 A 5 5 0 0 1 13 13 A 5 5 0 0 1 8 8 Z M 0 8 L 8 8 M 18 8 L 24 8 M 4 3 L 4 13" stroke="black" fill="transparent"/>', 32, 20);
Format.ERzeroToManyMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 8 8 A 5 5 0 0 1 13 3 A 5 5 0 0 1 18 8 A 5 5 0 0 1 13 13 A 5 5 0 0 1 8 8 Z M 0 8 L 8 8 M 18 8 L 24 8 M 0 3 L 8 8 L 0 13" stroke="black" fill="transparent"/>', 32, 20);
Format.EROneMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 5 2 L 5 14 M 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.baseDashMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 2 L 0 14 M 0 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.doubleBlockMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 8 2 L 8 14 Z M 8 8 L 16 2 L 16 14 Z M 16 8 L 24 8" stroke="black" fill="transparent"/>', 32, 20);
Format.doubleBlockFilledMarkerImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,2)" stroke-width="2.5" d="M 0 8 L 8 2 L 8 14 Z M 8 8 L 16 2 L 16 14 Z M 16 8 L 24 8" stroke="black" fill="black"/>', 32, 20);
Format.connectionImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,3)" stroke-width="2.5" d="M 0 8 L 26 8 L 26 4 L 32 8 L 26 12 L 26 8 Z" stroke="black" fill="black"/>', 42, 20);
Format.linkEdgeImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,3)" stroke-width="2.5" d="M 0 6 L 32 6 M 0 10 L 32 10" stroke="black" fill="black"/>', 42, 20);
Format.pipeEdgeImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,0)" stroke-width="10.5" d="M 0 10 L 34 10" stroke="black" fill="black"/>' +
	'<path transform="translate(4,0)" stroke-width="4.5" d="M 0 10 L 34 10" stroke="lightblue" fill="black"/>', 42, 20);
Format.filledEdgeImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,0)" stroke-width="8.5" d="M 0 10 L 34 10" stroke="black" fill="black"/>' +
	'<path transform="translate(4,0)" stroke-width="4.5" d="M 0 10 L 34 10" stroke="white" fill="black"/>', 42, 20);
Format.wireEdgeImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,0)" stroke-dasharray="8 8" stroke-width="3.5" d="M 0 10 L 34 10" stroke="red" fill="black"/>' +
	'<path transform="translate(4,0)" stroke-dashoffset="8" stroke-dasharray="8 8" stroke-width="3.5" d="M 0 10 L 34 10" stroke="green" fill="black"/>', 42, 20);
Format.arrowImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,3)" stroke-width="2.5" d="M 0 6 L 24 6 L 24 2 L 32 8 L 24 14 L 24 10 L 0 10 Z" stroke="black" fill="none"/>', 42, 20);
Format.simpleArrowImage = Graph.createSvgImage(20, 22, '<path transform="translate(4,3)" stroke-width="2.5" d="M 0 6 L 4 6 L 4 10 L 0 10 Z M 7 6 L 18 6 L 18 2 L 25 8 L 18 14 L 18 10 L 7 10 Z M 28 6 L 28 6 L 32 6 L 32 10 L 28 10 Z" stroke="black" fill="none"/>', 42, 20);
Format.straightImage = Graph.createSvgImage(16, 18, '<path transform="translate(3,4)" stroke-width="2.5" d="M 0 26 L 4 26 L 4 30 L 0 30 Z M 4 26 L 26 4 M 26 0 L 30 0 L 30 4 L 26 4 Z" stroke="black" fill="none"/>', 36, 36);
Format.orthogonalImage = Graph.createSvgImage(16, 18, '<path transform="translate(3,4)" stroke-width="2.5" d="M 0 26 L 4 26 L 4 30 L 0 30 Z M 2 26 L 2 14 L 28 14 L 28 4 M 26 0 L 30 0 L 30 4 L 26 4 Z" stroke="black" fill="none"/>', 36, 36);
Format.horizontalElbowImage = Graph.createSvgImage(16, 18, '<path transform="translate(3,4)" stroke-width="2.5" d="M 13 0 L 17 0 L 17 4 L 13 4 Z M 15 4 L 15 26 M 13 26 L 17 26 L 17 30 L 13 30 Z M 12 15 L 6 15 M 4 15 L 6 13 L 6 17 Z M 18 15 L 24 15 M 26 15 L 24 13 L 24 17 Z" stroke="black" fill="none"/>', 36, 36);
Format.verticalElbowImage = Graph.createSvgImage(16, 18, '<path transform="translate(3,4)" stroke-width="2.5" d="M 0 13 L 4 13 L 4 17 L 0 17 Z M 4 15 L 26 15 M 26 13 L 30 13 L 30 17 L 26 17 Z M 15 12 L 15 6 M 15 4 L 17 6 L 13 6 Z M 15 18 L 15 24 M 15 26 L 17 24 L 13 24 Z" stroke="black" fill="none"/>', 36, 36);
Format.horizontalIsometricImage = Graph.createSvgImage(16, 18, '<path transform="translate(3,4)" stroke-width="2.5" d="M 0 26 L 4 26 L 4 30 L 0 30 Z M 4 26 L 19 17 L 10 12 L 26 4 M 26 0 L 30 0 L 30 4 L 26 4 Z" stroke="black" fill="none"/>', 36, 36);
Format.verticalIsometricImage = Graph.createSvgImage(16, 18, '<path transform="translate(32,4)scale(-1,1)" stroke-width="2.5" d="M 0 26 L 4 26 L 4 30 L 0 30 Z M 4 26 L 19 17 L 10 12 L 26 4 M 26 0 L 30 0 L 30 4 L 26 4 Z" stroke="black" fill="none"/>', 36, 36);
Format.curvedImage = Graph.createSvgImage(16, 18, '<path transform="translate(3,4)" stroke-width="2.5" d="M 0 26 L 4 26 L 4 30 L 0 30 Z M 2 26 Q 2 14 14 14 Q 28 14 28 4 M 26 0 L 30 0 L 30 4 L 26 4 Z" stroke="black" fill="none"/>', 36, 36);
Format.entityImage = Graph.createSvgImage(16, 18, '<path transform="translate(3,4)" stroke-width="2.5" d="M 0 26 L 4 26 L 4 30 L 0 30 Z M 4 28 L 10 28 L 20 2 L 26 2 M 26 0 L 30 0 L 30 4 L 26 4 Z" stroke="black" fill="none"/>', 36, 36);
Format.sharpBendImage = Graph.createSvgImage(16, 18, '<path transform="translate(3,4)" stroke-width="2.5" d="M 6 2 L 6 22 L 26 22" stroke="black" fill="none"/>', 36, 36);
Format.roundedBendImage = Graph.createSvgImage(16, 18, '<path transform="translate(3,4)" stroke-width="2.5" d="M 6 2 L 6 12 Q 6 22 16 22 L 26 22" stroke="black" fill="none"/>', 36, 36);
Format.curvedBendImage = Graph.createSvgImage(16, 18, '<path transform="translate(3,4)" stroke-width="2.5" d="M 6 2 Q 6 22 26 22" stroke="black" fill="none"/>', 36, 36);

/**
 * Adds a style change item to the given menu.
 */
Format.processMenuIcon = function(elt, transform)
{
	var imgs = elt.getElementsByTagName('img');

	if (imgs.length > 0)
	{
		imgs[0].className = 'geAdaptiveAsset geStyleMenuItem';

		if (transform != null)
		{
			mxUtils.setPrefixedStyle(imgs[0].style, 'transform', transform);
		}
	}

	return elt;
};

/**
 * Returns information about the current selection.
 */
Format.prototype.labelIndex = 0;

/**
 * Returns information about the current selection.
 */
Format.prototype.diagramIndex = 0;

/**
 * Returns information about the current selection.
 */
Format.prototype.currentIndex = 0;

/**
 * Returns information about the current selection.
 */
Format.prototype.rounded = false;

/**
 * Returns information about the current selection.
 */
Format.prototype.curved = false;

/**
 * Adds the label menu items to the given menu and parent.
 */
Format.prototype.init = function()
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	
	this.update = mxUtils.bind(this, function(sender, evt)
	{
		this.refresh();
	});
	
	graph.getSelectionModel().addListener(mxEvent.CHANGE, this.update);
	graph.getModel().addListener(mxEvent.CHANGE, this.update);
	graph.addListener(mxEvent.EDITING_STARTED, this.update);
	graph.addListener(mxEvent.EDITING_STOPPED, this.update);
	graph.getView().addListener('unitChanged', this.update);
	editor.addListener('autosaveChanged', this.update);
	graph.addListener(mxEvent.ROOT, this.update);
	ui.addListener('styleChanged', this.update);
	ui.addListener('lockedChanged', this.update);
	ui.addListener('languageChanged', this.update);
	ui.addListener('formatWidthChanged', this.update);
	
	this.refresh();
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Format.prototype.clear = function()
{
	this.container.innerText = '';
	
	// Destroy existing panels
	if (this.panels != null)
	{
		for (var i = 0; i < this.panels.length; i++)
		{
			this.panels[i].destroy();
		}
	}
	
	this.panels = [];
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Format.prototype.refresh = function()
{
	if (this.pendingRefresh != null)
	{
		window.clearTimeout(this.pendingRefresh);
		this.pendingRefresh = null;
	}

	this.pendingRefresh = window.setTimeout(mxUtils.bind(this, function()
	{
		this.immediateRefresh();
	}));
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Format.prototype.immediateRefresh = function()
{
	// Skips refresh if not visible
	if (this.container.offsetWidth == 0)
	{
		return;
	}
	
	this.clear();
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	
	var div = document.createElement('div');
	div.className = 'geFormatContent';
	var label = document.createElement('div');
	label.className = 'geFormatTitle';
	this.container.appendChild(div);
	
	var ss = ui.getSelectionState();
	var containsLabel = ss.containsLabel;
	var currentLabel = null;
	var currentPanel = null;
	
	var addClickHandler = mxUtils.bind(this, function(elt, panel, index, lastEntry)
	{
		var clickHandler = mxUtils.bind(this, function(evt, skipIndex)
		{
			if (currentLabel != elt)
			{
				if (!skipIndex)
				{
					if (containsLabel)
					{
						this.labelIndex = index;
					}
					else if (graph.isSelectionEmpty())
					{
						this.diagramIndex = index;
					}
					else
					{
						this.currentIndex = index;
					}
				}
				
				if (currentLabel != null)
				{
					currentLabel.classList.remove('geActiveFormatTitle');
				}

				currentLabel = elt;
				currentLabel.classList.add('geActiveFormatTitle');

				if (currentPanel != panel)
				{
					if (currentPanel != null)
					{
						currentPanel.style.display = 'none';
					}
					
					currentPanel = panel;
					currentPanel.style.display = '';
				}
			}
		});
		
		mxEvent.addListener(elt, 'click', clickHandler);

		var currentIndex = (containsLabel) ? this.labelIndex :
			((graph.isSelectionEmpty()) ? this.diagramIndex :
				this.currentIndex);
		
		if ((lastEntry && currentLabel == null) ||
			index == currentIndex)
		{
			clickHandler(null, lastEntry && currentLabel == null);
		}
	});
	
	var idx = 0;

	if (graph.isSelectionEmpty())
	{
		var title = document.createElement('div');
		mxUtils.write(title, mxResources.get('diagram'));
		label.appendChild(title);
		label.setAttribute('title', mxResources.get('diagram'));
		div.appendChild(label);
		var diagramPanel = div.cloneNode(false);
		this.panels.push(new DiagramFormatPanel(this, ui, diagramPanel));
		this.container.appendChild(diagramPanel);
		diagramPanel.style.display = 'none';
		
		var label2 = label.cloneNode(false);
		addClickHandler(label, diagramPanel, idx++);
		
		var stylePanel = div.cloneNode(false);
		stylePanel.style.display = 'none';
		var title = document.createElement('div');
		mxUtils.write(title, ui.functionDesignMode ? '功能设计' : mxResources.get('style'));
		label2.appendChild(title);
		label2.setAttribute('title', ui.functionDesignMode ? '功能设计' : mxResources.get('style'));
		div.appendChild(label2);
		this.panels.push(ui.functionDesignMode ?
			new FunctionDesignFormatPanel(this, ui, stylePanel) :
			new DiagramStylePanel(this, ui, stylePanel));
		this.container.appendChild(stylePanel);
		
		addClickHandler(label2, stylePanel, idx++, true);
	}
	else if (graph.isEditing())
	{
		// Text Editing
		var title = document.createElement('div');
		mxUtils.write(title, mxResources.get('text'));
		label.appendChild(title);
		label.setAttribute('title', mxResources.get('text'));
		div.appendChild(label);

		var textPanel = div.cloneNode(false);
		textPanel.style.display = 'none';
		this.panels.push(new TextFormatPanel(this, ui, textPanel));
		this.container.appendChild(textPanel);

		addClickHandler(label, textPanel, idx++, true);
	}
	else
	{
		if (ui.functionDesignMode)
		{
			var title = document.createElement('div');
			mxUtils.write(title, '功能设计');
			label.appendChild(title);
			label.setAttribute('title', '功能设计');
			div.appendChild(label);

			var stylePanel = div.cloneNode(false);
			stylePanel.style.display = 'none';
			this.panels.push(new FunctionDesignFormatPanel(this, ui, stylePanel));
			this.container.appendChild(stylePanel);

			addClickHandler(label, stylePanel, idx++, true);
			div.className = 'geFormatTitleContainer';
			return;
		}

		var label2 = label.cloneNode(false);
		var label3 = label2.cloneNode(false);
		
		// Style
		if (ss.cells.length > 0)
		{
			var title = document.createElement('div');
			mxUtils.write(title, ui.functionDesignMode ? '功能设计' : mxResources.get('style'));
			label.appendChild(title);
			label.setAttribute('title', ui.functionDesignMode ? '功能设计' : mxResources.get('style'));
			div.appendChild(label);
			
			var stylePanel = div.cloneNode(false);
			stylePanel.style.display = 'none';
			this.panels.push(ui.functionDesignMode ?
				new FunctionDesignFormatPanel(this, ui, stylePanel) :
				new StyleFormatPanel(this, ui, stylePanel));
			this.container.appendChild(stylePanel);

			addClickHandler(label, stylePanel, idx++);
		}
		
		// Text
		var title = document.createElement('div');
		mxUtils.write(title, mxResources.get('text'));
		label2.appendChild(title);
		label2.setAttribute('title', mxResources.get('text'));
		div.appendChild(label2);

		var textPanel = div.cloneNode(false);
		textPanel.style.display = 'none';
		this.panels.push(new TextFormatPanel(this, ui, textPanel));
		this.container.appendChild(textPanel);
		
		// Arrange
		var title = document.createElement('div');
		mxUtils.write(title, mxResources.get('arrange'));
		label3.appendChild(title);
		label3.setAttribute('title', mxResources.get('arrange'));
		div.appendChild(label3);

		var arrangePanel = div.cloneNode(false);
		arrangePanel.style.display = 'none';
		this.panels.push(new ArrangePanel(this, ui, arrangePanel));
		this.container.appendChild(arrangePanel);

		if (ss.cells.length > 0)
		{
			addClickHandler(label2, textPanel, idx++);
		}
		else
		{
			label2.style.display = 'none';
		}
		
		addClickHandler(label3, arrangePanel, idx++, true);
	}
	
	div.className = 'geFormatTitleContainer';
};

/**
 * Base class for format panels.
 */
BaseFormatPanel = function(format, editorUi, container)
{
	this.format = format;
	this.editorUi = editorUi;
	this.container = container;
	this.listeners = [];
};

/**
 * 
 */
BaseFormatPanel.prototype.buttonBackgroundColor = 'transparent';

/**
 * Install input handler.
 */
BaseFormatPanel.prototype.installInputHandler = function(input, key, defaultValue, min, max, unit, textEditFallback, isFloat, useUnits)
{
	unit = (unit != null) ? unit : '';
	isFloat = (isFloat != null) ? isFloat : false;
	
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	
	min = (min != null) ? min : 1;
	max = (max != null) ? max : 999;
	
	var selState = null;
	var updating = false;
	var lastValue = null;
	
	var update = mxUtils.bind(this, function(evt)
	{
		var value = (isFloat) ? parseFloat(input.value) : parseInt(input.value);

		if (useUnits)
		{
			value = this.fromUnit(value);
		}

		if (value != lastValue)
		{
			lastValue = value;

			// Special case: angle mod 360
			if (!isNaN(value) && key == mxConstants.STYLE_ROTATION)
			{
				// Workaround for decimal rounding errors in floats is to
				// use integer and round all numbers to two decimal point
				value = mxUtils.mod(Math.round(value * 100), 36000) / 100;
			}
			
			value = Math.min(max, Math.max(min, (isNaN(value)) ? defaultValue : value));
			
			if (graph.cellEditor.isContentEditing() && textEditFallback)
			{
				if (!updating)
				{
					updating = true;
					
					if (selState != null)
					{
						graph.cellEditor.restoreSelection(selState);
						selState = null;
					}
					
					textEditFallback(value);
					input.value = (useUnits? this.inUnit(value) : value) + unit;
		
					// Restore focus and selection in input
					updating = false;
				}
			}
			else if (value != mxUtils.getValue(ui.getSelectionState().style, key, defaultValue))
			{
				if (graph.isEditing())
				{
					graph.stopEditing(true);
				}
				
				graph.getModel().beginUpdate();
				try
				{
					var cells = ui.getSelectionState().cells;
					graph.setCellStyles(key, value, cells);

					// Handles special case for fontSize where HTML labels are parsed and updated
					if (key == mxConstants.STYLE_FONTSIZE)
					{
						graph.updateLabelElements(cells, function(elt)
						{
							elt.removeAttribute('size');
							elt.style.fontSize = '';
							
							if (elt.getAttribute('style') == '')
							{
								elt.removeAttribute('style');
							}
						});
					}
					
					for (var i = 0; i < cells.length; i++)
					{
						if (graph.model.getChildCount(cells[i]) == 0)
						{
							graph.autoSizeCell(cells[i], false);
						}

						if (key != mxConstants.STYLE_FONTSIZE &&
							graph.isAutosizeTextCell(cells[i]) &&
							graph.model.isVertex(cells[i]))
						{
							graph.updateAutosizeTextFontSize(cells[i],
								graph.getCurrentCellStyle(cells[i], true));
						}
					}
					
					ui.fireEvent(new mxEventObject('styleChanged', 'keys', [key],
							'values', [value], 'cells', cells));
				}
				finally
				{
					graph.getModel().endUpdate();
				}
			}
			
			input.value = (useUnits? this.inUnit(value) : value) + unit;
		}

		mxEvent.consume(evt);
	});

	if (textEditFallback && graph.cellEditor.isContentEditing())
	{
		mxEvent.addGestureListeners(input, mxUtils.bind(this, function(evt)
		{
			if (document.activeElement == graph.cellEditor.textarea)
			{
				selState = graph.cellEditor.saveSelection();
			}
		}));
	}
	
	mxEvent.addListener(input, 'change', update);
	mxEvent.addListener(input, 'blur', update);

	return update;
};

/**
 * Adds the given option.
 */
BaseFormatPanel.prototype.createPanel = function()
{
	var div = document.createElement('div');
	div.className = 'geFormatSection';
	
	return div;
};

/**
 * Adds the given option.
 */
BaseFormatPanel.prototype.createTitle = function(title)
{
	var div = document.createElement('div');
	div.className = 'geFormatSectionTitle';
	div.setAttribute('title', title);
	mxUtils.write(div, title);

	return div;
};

/**
 * Creates a collapsible section with a toggle chevron.
 * Returns {wrapper, contentDiv} where contentDiv is the
 * container for section content.
 */
BaseFormatPanel.prototype.createCollapsibleSection = function(title, defaultCollapsed)
{
	var state = this.format.collapsedSections;

	// Use stored state if available, otherwise use default
	var collapsed = (state[title] != null) ? state[title] : defaultCollapsed;

	var wrapper = document.createElement('div');
	wrapper.className = 'geFormatSection';

	var titleDiv = document.createElement('div');
	titleDiv.className = 'geCollapsibleTitle' + (collapsed ? '' : ' geExpanded');
	titleDiv.setAttribute('title', title);
	mxUtils.write(titleDiv, title);
	wrapper.appendChild(titleDiv);

	var contentDiv = document.createElement('div');
	contentDiv.className = 'geCollapsibleContent' + (collapsed ? ' geCollapsed' : '');
	wrapper.appendChild(contentDiv);

	mxEvent.addListener(titleDiv, 'click', function()
	{
		titleDiv.classList.toggle('geExpanded');
		contentDiv.classList.toggle('geCollapsed');
		state[title] = !titleDiv.classList.contains('geExpanded');
	});

	return {wrapper: wrapper, contentDiv: contentDiv};
};

/**
 * Hides the collapsible wrapper if inner panel is hidden (display none)
 * or has no visible children. Also observes style changes to keep in sync.
 */
BaseFormatPanel.prototype.syncCollapsibleVisibility = function(wrapper, innerPanel)
{
	var update = function()
	{
		wrapper.style.display = (innerPanel.style.display == 'none') ? 'none' : '';
	};

	// Initial check
	update();

	// Observe attribute changes on inner panel for dynamic display toggling
	if (typeof MutationObserver !== 'undefined')
	{
		var observer = new MutationObserver(update);
		observer.observe(innerPanel, {attributes: true, attributeFilter: ['style']});
		this.listeners.push({destroy: function() { observer.disconnect(); }});
	}
};

/**
 *
 */
BaseFormatPanel.prototype.addAction = function(div, name)
{
	var action = this.editorUi.actions.get(name);
	var btn = null;

	if (action != null && action.isEnabled())
	{
		btn = mxUtils.button(action.getTitle(), mxUtils.bind(this, function(evt)
		{
			try
			{
				action.funct(evt, evt);
			}
			catch (e)
			{
				this.editorUi.handleError(e);
			}
		}));
		
		var short = (action.shortcut != null) ? ' (' + action.shortcut + ')' : '';
		btn.setAttribute('title', action.getTitle() + short);
		btn.style.marginBottom = '2px';
		btn.className = 'geFullWidthElement';
		div.appendChild(btn);
	}

	return btn;
};

/**
 * 
 */
BaseFormatPanel.prototype.addActions = function(div, names)
{
	var lastBr = null;
	var last = null;
	var count = 0;

	for (var i = 0; i < names.length; i++)
	{
		var btn = this.addAction(div, names[i]);

		if (btn != null)
		{
			count++;

			if (mxUtils.mod(count, 2) == 0)
			{
				last.style.marginRight = '4px';
				last.style.width = '104px';
				btn.style.width = '104px';
				lastBr.parentNode.removeChild(lastBr);
			}

			lastBr = mxUtils.br(div);
			last = btn;
		}
	}

	return count;
};

/**
 * 
 */
BaseFormatPanel.prototype.createStepper = function(input, update, step, height, disableFocus, defaultValue, isFloat)
{
	step = (step != null) ? step : 1;
	height = (height != null) ? height : 9;
	var bigStep = 10 * step;
	
	var stepper = document.createElement('div');
	stepper.className = 'geBtnStepper';
	stepper.style.position = 'absolute';
	stepper.style.left = '200px';
	
	var up = document.createElement('div');
	up.style.height = '9px';
	up.style.backgroundImage = 'url(' + Editor.arrowUpImage + ')';
	up.style.width = '10px';
	stepper.appendChild(up);
	
	var down = up.cloneNode(false);
	down.style.backgroundImage = 'url(' + Editor.arrowDownImage + ')';
	stepper.appendChild(down);

	function changeValue(increment, localDefaultValue, evt)
	{
		if (input.value == '')
		{
			input.value = (defaultValue != null) ? defaultValue : localDefaultValue;
		}
		
		var val = isFloat? parseFloat(input.value) : parseInt(input.value);
		
		if (!isNaN(val))
		{
			input.value = val + increment;
			
			if (update != null)
			{
				update(evt);
			}
		}
	};
	
	mxEvent.addGestureListeners(up, function(evt)
	{
		// Stops text selection on shift+click
		mxEvent.consume(evt);
	}, null, function(evt)
	{
		changeValue(mxEvent.isShiftDown(evt) ? bigStep : step, '0', evt);
		mxEvent.consume(evt);
	});
	
	mxEvent.addGestureListeners(down, function(evt)
	{
		// Stops text selection on shift+click
		mxEvent.consume(evt);
	}, null, function(evt)
	{
		changeValue(-(mxEvent.isShiftDown(evt) ? bigStep : step), '2', evt);
		mxEvent.consume(evt);
	});
	
	// Disables transfer of focus to DIV but also :active CSS
	// so it's only used for fontSize where the focus should
	// stay on the selected text, but not for any other input.
	if (disableFocus)
	{
		var currentSelection = null;
		
		mxEvent.addGestureListeners(stepper,
			function(evt)
			{
				mxEvent.consume(evt);
			},
			null,
			function(evt)
			{
				// Workaround for lost current selection in page because of focus in IE
				if (currentSelection != null)
				{
					try
					{
						currentSelection.select();
					}
					catch (e)
					{
						// ignore
					}
					
					currentSelection = null;
					mxEvent.consume(evt);
				}
			}
		);
	}
	else
	{
		// Stops propagation on checkbox labels
		mxEvent.addListener(stepper, 'click', function(evt)
		{
			mxEvent.consume(evt);
		});
	}
	
	return stepper;
};

/**
 * Adds the given option.
 */
BaseFormatPanel.prototype.createOption = function(label, isCheckedFn, setCheckedFn, listener, fn)
{
	var div = document.createElement('div');
	div.className = 'geFormatEntry';
	
	var cb = document.createElement('input');
	cb.setAttribute('type', 'checkbox');
	cb.setAttribute('title', label);
	div.appendChild(cb);

	var elt = document.createElement('span');
	elt.className = 'geStyleLabel';
	elt.setAttribute('title', label);
	mxUtils.write(elt, label);
	div.appendChild(elt);

	var applying = false;
	var value = isCheckedFn();
	
	var apply = function(newValue, evt)
	{
		if (!applying)
		{
			applying = true;
			
			if (newValue)
			{
				cb.setAttribute('checked', 'checked');
				cb.defaultChecked = true;
				cb.checked = true;
			}
			else
			{
				cb.removeAttribute('checked');
				cb.defaultChecked = false;
				cb.checked = false;
			}
			
			if (value != newValue)
			{
				value = newValue;
				
				// Checks if the color value needs to be updated in the model
				if (isCheckedFn() != value)
				{
					setCheckedFn(value, evt);
				}
			}
			
			applying = false;
		}
	};

	mxEvent.addListener(div, 'click', function(evt)
	{
		if (cb.getAttribute('disabled') != 'disabled')
		{
			// Toggles checkbox state for click on label
			var source = mxEvent.getSource(evt);
			
			if (source == div || source == elt)
			{
				cb.checked = !cb.checked;
			}
			
			apply(cb.checked, evt);
		}
	});
	
	apply(value);
	
	if (listener != null)
	{
		listener.install(apply);
		this.listeners.push(listener);
	}
	
	if (fn != null)
	{
		fn(div);
	}

	return div;
};

/**
 * The string 'null' means use null in values.
 */
BaseFormatPanel.prototype.createCellOption = function(label, key, defaultValue, enabledValue, disabledValue, fn, action, stopEditing, cells)
{	
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	
	enabledValue = (enabledValue != null) ? ((enabledValue == 'null') ? null : enabledValue) : 1;
	disabledValue = (disabledValue != null) ? ((disabledValue == 'null') ? null : disabledValue) : 0;

	var style = (cells != null) ? graph.getCommonStyle(cells) : ui.getSelectionState().style;

	return this.createOption(label, function()
	{
		return mxUtils.getValue(style, key, defaultValue) != disabledValue;
	}, function(checked)
	{
		if (stopEditing)
		{
			graph.stopEditing();
		}
		
		if (action != null)
		{
			action.funct();
		}
		else
		{
			graph.getModel().beginUpdate();
			try
			{
				var temp = (cells != null) ? cells : ui.getSelectionState().cells;
				var value = (checked) ? enabledValue : disabledValue;
				graph.setCellStyles(key, value, temp);

				if (fn != null)
				{
					fn(temp, value);
				}
				
				ui.fireEvent(new mxEventObject('styleChanged', 'keys',
					[key], 'values', [value], 'cells', temp));
			}
			finally
			{
				graph.getModel().endUpdate();
			}
		}
	},
	{
		install: function(apply)
		{
			this.listener = function()
			{
				apply(mxUtils.getValue(style, key, defaultValue) != disabledValue);
			};
			
			graph.getModel().addListener(mxEvent.CHANGE, this.listener);
		},
		destroy: function()
		{
			graph.getModel().removeListener(this.listener);
		}
	});
};

/**
 * Adds the given color option.
 */
BaseFormatPanel.prototype.createColorOption = function(label, getColorFn, setColorFn, defaultColor,
	listener, callbackFn, hideCheckbox, defaultColorValue, singleColorMode, isDarkModeFn)
{
	var darkModeOverridden = isDarkModeFn != null;
	isDarkModeFn = (isDarkModeFn != null) ? isDarkModeFn : Editor.isDarkMode;

	var graph = this.editorUi.editor.graph;
	var div = document.createElement('div');
	div.className = 'geFormatEntry';
	
	var cb = document.createElement('input');
	cb.setAttribute('type', 'checkbox');
	cb.setAttribute('title', label);

	if (!hideCheckbox)
	{
		div.appendChild(cb);
	}

	var span = document.createElement('span');
	mxUtils.write(span, label);
	span.setAttribute('title', label);
	div.appendChild(span);

	var value = getColorFn();
	var applying = false;
	var dropper = null;
	var btn = null;

	var clrInput = document.createElement('input');
	clrInput.setAttribute('type', 'color');
	clrInput.style.position = 'relative';
	clrInput.style.visibility = 'hidden';
	clrInput.style.top = '10px';
	clrInput.style.width = '0px';
	clrInput.style.height = '0px';
	clrInput.style.border = 'none';

	// Extracts single color value from light-dark color
	function getActualColorValue(color, allowDefault)
	{
		if (color == 'default' && !allowDefault)
		{
			color = defaultColorValue;
		}

		if (color != 'default' && singleColorMode)
		{
			var temp = mxUtils.getLightDarkColor(color);
			color = (isDarkModeFn()) ? temp.dark : temp.light;
		}

		return color;
	};

	// Adds native color dialog
	if (!mxClient.IS_TOUCH)
	{
		dropper = document.createElement('img');
		dropper.src = Editor.colorDropperImage;
		dropper.className = 'geColorDropper geAdaptiveAsset';

		mxEvent.addListener(dropper, 'click', function(evt)
		{
			clrInput.value = getActualColorValue(value);
			clrInput.click();
			mxEvent.consume(evt);
		});
	}
	
	var selState = null;
	
	var apply = function(color, disableUpdate)
	{
		if (!applying)
		{
			applying = true;

			if (callbackFn != null)
			{
				callbackFn(color);
			}
			
			if (!disableUpdate)
			{
				if (selState != null)
				{
					graph.cellEditor.restoreSelection(selState);
					selState = null;
				}

				setColorFn(color);
			}

			value = getColorFn();
			var cssColor = mxUtils.getLightDarkColor(
				(value != 'default') ? value :
					defaultColorValue);

			var div = document.createElement('div');
			div.style.width = '21px';
			div.style.height = '12px';
			div.style.margin = '2px 18px 2px 3px';
			div.style.borderWidth = '1px';
			div.style.borderStyle = 'solid';
			div.style.backgroundColor = cssColor.cssText;
			btn.innerText = '';
			btn.appendChild(div);
			
			if (!singleColorMode && mxUtils.isLightDarkColor(value) &&
				cssColor.light != cssColor.dark)
			{
				div.style.background = 'linear-gradient(to right bottom, ' +
					cssColor.cssText + ' 50%, ' + mxUtils.invertLightDarkColor(cssColor).
					cssText + ' 50.3%)';
			}
			else if (singleColorMode && darkModeOverridden)
			{
				// Handles special case of fixed color
				div.style.backgroundColor = (isDarkModeFn()) ?
					cssColor.dark : cssColor.light;
			}

			if (dropper != null)
			{
				div.style.width = '21px';
				div.style.margin = '2px 18px 2px 3px';
				div.appendChild(dropper);
			}
			else
			{
				div.style.width = '36px';
				div.style.margin = '3px';
			}

			// Adds tooltip to color button
			if (value != null && value != mxConstants.NONE &&
				value.length > 1 && typeof value === 'string')
			{
				var clr = (value.charAt(0) == '#') ?
				value.substring(1).toUpperCase() : value;
				var name = ColorDialog.prototype.colorNames[clr];

				if (name != null)
				{
					btn.setAttribute('title', name);
				}
				else if (value == 'default')
				{
					btn.setAttribute('title', mxResources.get('useBlackAndWhite'));
				}
				else
				{
					btn.setAttribute('title', value);
				}
			}

			if (graph.isSpecialColor(value))
			{
				cb.style.display = 'none';
			}
			else
			{
				cb.style.display = '';

				if (value != null && value != mxConstants.NONE)
				{
					cb.setAttribute('checked', 'checked');
					cb.defaultChecked = true;
					cb.checked = true;
				}
				else
				{
					cb.removeAttribute('checked');
					cb.defaultChecked = false;
					cb.checked = false;
				}
			}
	
			btn.style.display = (cb.checked || hideCheckbox) ? '' : 'none';
			applying = false;
		}
	};
	
	div.appendChild(clrInput);

	mxEvent.addListener(clrInput, 'change', function()
	{
		var color = clrInput.value;

		// Adds selected color to light-dark color
		if (!singleColorMode)
		{
			var cssColor = mxUtils.getLightDarkColor(value);

			if (isDarkModeFn())
			{
				cssColor.dark = color;
			}
			else
			{
				cssColor.light = color;
			}

			color = 'light-dark(' + cssColor.light +
				', ' + cssColor.dark + ')';
		}

		apply(color);
	});

	btn = mxUtils.button('', mxUtils.bind(this, function(evt)
	{
		var actualDefaultValue = defaultColorValue;

		if (singleColorMode && isDarkModeFn() &&
			mxUtils.isLightDarkColor(actualDefaultValue))
		{
			actualDefaultValue = mxUtils.getLightDarkColor(defaultColorValue).dark;
		}

		this.editorUi.pickColor(getActualColorValue(value, true), function(newColor)
		{
			apply(newColor);
		}, (defaultColor == 'default') ? 'default' : null,
			actualDefaultValue, singleColorMode);

		mxEvent.consume(evt);
	}));
	
	btn.className = 'geColorBtn';
	btn.style.display = (cb.checked || hideCheckbox) ? '' : 'none';
	div.appendChild(btn);

	var clr = (value != null && typeof value === 'string' &&value.charAt(0) == '#') ?
		value.substring(1).toUpperCase() : value;
	var name = ColorDialog.prototype.colorNames[clr];

	if (name != null)
	{
		btn.setAttribute('title', name);
	}

	if (!hideCheckbox)
	{
		mxEvent.addListener(div, 'click', function(evt)
		{
			var source = mxEvent.getSource(evt);
			
			if (source == cb || source.nodeName != 'INPUT')
			{		
				// Toggles checkbox state for click on label
				if (source != cb)
				{
					cb.checked = !cb.checked;
				}
		
				// Overrides default value with current value to make it easier
				// to restore previous value if the checkbox is clicked twice
				if (!cb.checked && value != null && value != mxConstants.NONE &&
					defaultColor != mxConstants.NONE)
				{
					defaultColor = getActualColorValue(value);
				}
				
				apply((cb.checked) ? defaultColor : mxConstants.NONE);
			}
		});

		mxEvent.addGestureListeners(cb, mxUtils.bind(this, function(evt)
		{
			if (document.activeElement == graph.cellEditor.textarea)
			{
				selState = graph.cellEditor.saveSelection();
			}
		}));
	
		mxEvent.addGestureListeners(div, mxUtils.bind(this, function(evt)
		{
			if (document.activeElement == graph.cellEditor.textarea)
			{
				selState = graph.cellEditor.saveSelection();
			}
		}));
	}
	
	apply(value, true);
	
	if (listener != null)
	{
		listener.install(function()
		{
			apply(value, true);
		}, this.listeners.push(listener));
	}

	return div;
};

/**
 * 
 */
BaseFormatPanel.prototype.createArrayCellColorOption = function(label, colorKey, defaultColor,
	callbackFn, setStyleFn, defaultColorValue, undefinedValue)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	var style = graph.getCellStyle(graph.getSelectionCell(), false);
	var value = (style != null) ? ((style[colorKey] != null) ?
		style[colorKey] : undefinedValue) : null;
	var values = (value != null) ? mxUtils.parseColorList(value) : [];
	var div = document.createElement('div');

	for (var i = 0; i < values.length; i++)
	{
		(mxUtils.bind(this, function(index)
		{
			div.appendChild(this.createColorOption(label + ' (' + (index + 1) + ')', function()
			{
				return values[i];
			}, function(color)
			{
				graph.getModel().beginUpdate();
				try
				{
					var cells = ui.getSelectionState().cells;
					values[index] = color;
					var temp = values.join(',');
					graph.setCellStyles(colorKey, temp, cells);

					if (setStyleFn != null)
					{
						setStyleFn(color);
					}
					
					ui.fireEvent(new mxEventObject('styleChanged', 'keys', [colorKey],
						'values', [temp], 'cells', cells));
				}
				finally
				{
					graph.getModel().endUpdate();
				}
			}, defaultColor || mxConstants.NONE,
			{
				install: function(apply)
				{
					this.listener = function()
					{
						var style = graph.getCellStyle(graph.getSelectionCell(), false);

						if (style != null)
						{
							var value = (style != null) ? ((style[colorKey] != null) ?
								style[colorKey] : undefinedValue) : null;
							values = (value != null) ?
								mxUtils.parseColorList(value) : [];
							apply(values[i], true);
						}
					};
					
					graph.getModel().addListener(mxEvent.CHANGE, this.listener);
				},
				destroy: function()
				{
					graph.getModel().removeListener(this.listener);
				}
			}, callbackFn, null, defaultColorValue));
		}))(i);
	}

	return div;
};

/**
 * 
 */
BaseFormatPanel.prototype.createCellColorOption = function(label, colorKey, defaultColor,
	callbackFn, setStyleFn, defaultColorValue, undefinedValue, allowArrays)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;

	function getValue()
	{
		var style = graph.getCellStyle(graph.getSelectionCell(), false);
		var returnValue = (style != null) ? style[colorKey] : null;

		// Handles special case for inherited colors
		if (returnValue == 'inherit')
		{
			var parent = graph.getModel().getParent(graph.getSelectionCell());
			var pstyle = graph.getCellStyle(parent, false);

			if (pstyle != null && pstyle[colorKey] != null)
			{
				returnValue = pstyle[colorKey];
			}
		}

		return (style != null) ? ((returnValue != null) ?
			returnValue : undefinedValue) : null;
	};

	var value = getValue();

	if (value != null && allowArrays && mxUtils.parseColorList(value).length > 1)
	{
		return this.createArrayCellColorOption(label, colorKey, defaultColor,
			callbackFn, setStyleFn, defaultColorValue, undefinedValue);
	}
	else
	{
		return this.createColorOption(label, getValue, function(color)
		{
			graph.getModel().beginUpdate();
			try
			{
				var cells = ui.getSelectionState().cells;
				graph.setCellStyles(colorKey, color, cells);

				if (setStyleFn != null)
				{
					setStyleFn(color);
				}
				
				ui.fireEvent(new mxEventObject('styleChanged', 'keys', [colorKey],
					'values', [color], 'cells', cells));
			}
			finally
			{
				graph.getModel().endUpdate();
			}
		}, defaultColor || mxConstants.NONE,
		{
			install: function(apply)
			{
				this.listener = function()
				{
					var style = graph.getCellStyle(graph.getSelectionCell(), false);

					if (style != null)
					{
						apply((style[colorKey] != null) ? style[colorKey] :
							undefinedValue, true);
					}
				};
				
				graph.getModel().addListener(mxEvent.CHANGE, this.listener);
			},
			destroy: function()
			{
				graph.getModel().removeListener(this.listener);
			}
		}, callbackFn, null, defaultColorValue);
	}
};

/**
 * 
 */
BaseFormatPanel.prototype.addArrow = function(elt)
{
	var arrow = document.createElement('div');
	arrow.className = 'geAdaptiveAsset geArrow';
	arrow.style.backgroundImage = 'url(' + Editor.thinExpandImage + ')';
	elt.className = 'geStyleBtn';
	elt.appendChild(arrow);

	return arrow;
};

/**
 * 
 */
BaseFormatPanel.prototype.addUnitInput = function(container, unit, right, width, update, step, marginTop, disableFocus, isFloat)
{
	marginTop = (marginTop != null) ? marginTop : 0;
	
	var input = document.createElement('input');
	input.style.position = 'absolute';
	input.style.left = (216 - right - width) + 'px';

	input.style.width = width + 'px';
	container.appendChild(input);
	
	var stepper = this.createStepper(input, update, step, disableFocus, null, isFloat);
	stepper.style.left = (216 - right) + 'px';
	container.appendChild(stepper);

	return input;
};

/**
 * 
 */
BaseFormatPanel.prototype.addGenericInput = function(container, unit, left, width, readFn, writeFn)
{
	var graph = this.editorUi.editor.graph;

	var update = function()
	{
		writeFn(input.value);
	};

	var input = this.addUnitInput(container, unit, left, width, update);

	var listener = mxUtils.bind(this, function(sender, evt, force)
	{
		if (force || input != document.activeElement)
		{
			input.value = readFn() + unit;
		}
	});
	
	mxEvent.addListener(input, 'keydown', function(e)
	{
		if (e.keyCode == 13)
		{
			graph.container.focus();
			mxEvent.consume(e);
		}
		else if (e.keyCode == 27)
		{
			listener(null, null, true);
			graph.container.focus();
			mxEvent.consume(e);
		}
	});
	
	graph.getModel().addListener(mxEvent.CHANGE, listener);
	this.listeners.push({destroy: function() { graph.getModel().removeListener(listener); }});
	listener();

	mxEvent.addListener(input, 'blur', update);
	mxEvent.addListener(input, 'change', update);

	return input;
};

/**
 * 
 */
BaseFormatPanel.prototype.createRelativeOption = function(label, key, width, handler, init)
{
	width = (width != null) ? width : 52;
	
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	var div = this.createPanel();
	div.className = 'geFormatEntry';
	mxUtils.write(div, label);
	div.setAttribute('title', label);
	div.style.fontWeight = 'bold';

	var update = mxUtils.bind(this, function(evt)
	{
		if (handler != null)
		{
			handler(input);
		}
		else
		{
			var value = parseInt(input.value);
			value = Math.min(100, Math.max(0, (isNaN(value)) ? 100 : value));
			var state = graph.view.getState(ui.getSelectionState().cells[0]);
			
			if (state != null && value != mxUtils.getValue(state.style, key, 100))
			{
				// Removes entry in style (assumes 100 is default for relative values)
				if (value == 100)
				{
					value = null;
				}
				
				var cells = ui.getSelectionState().cells;
				graph.setCellStyles(key, value, cells);
				this.editorUi.fireEvent(new mxEventObject('styleChanged', 'keys', [key],
					'values', [value], 'cells', cells));
			}
	
			input.value = ((value != null) ? value : '100') + ' %';
		}
		
		mxEvent.consume(evt);
	});

	var input = this.addUnitInput(div, '%', 16,
		width, update, 10, 0, handler != null);
	input.setAttribute('title', label);

	if (key != null)
	{
		var listener = mxUtils.bind(this, function(sender, evt, force)
		{
			if (force || input != document.activeElement)
			{
				var ss = ui.getSelectionState();
				var tmp = parseInt(mxUtils.getValue(ss.style, key, 100));
				input.value = (isNaN(tmp)) ? '' : tmp + ' %';
			}
		});
		
		mxEvent.addListener(input, 'keydown', function(e)
		{
			if (e.keyCode == 13)
			{
				graph.container.focus();
				mxEvent.consume(e);
			}
			else if (e.keyCode == 27)
			{
				listener(null, null, true);
				graph.container.focus();
				mxEvent.consume(e);
			}
		});
		
		graph.getModel().addListener(mxEvent.CHANGE, listener);
		this.listeners.push({destroy: function() { graph.getModel().removeListener(listener); }});
		listener();
	}

	mxEvent.addListener(input, 'blur', update);
	mxEvent.addListener(input, 'change', update);
	
	if (init != null)
	{
		init(input);
	}

	return div;
};

/**
 * 
 */
BaseFormatPanel.prototype.addLabel = function(div, title, right, width)
{
	width = (width != null) ? width : 61;

	var label = document.createElement('div');
	mxUtils.write(label, title);
	label.setAttribute('title', title);
	label.style.position = 'absolute';
	label.style.left = (226 - right - width) + 'px';
	label.style.width = width + 'px';
	label.style.marginTop = '10px';
	label.style.display = 'flex';
	label.style.justifyContent = 'center';
	div.appendChild(label);

	return label;
};

/**
 * 
 */
BaseFormatPanel.prototype.addKeyHandler = function(input, listener)
{
	mxEvent.addListener(input, 'keydown', mxUtils.bind(this, function(e)
	{
		if (e.keyCode == 13)
		{
			this.editorUi.editor.graph.container.focus();
			mxEvent.consume(e);
		}
		else if (e.keyCode == 27)
		{
			if (listener != null)
			{
				listener(null, null, true);				
			}

			this.editorUi.editor.graph.container.focus();
			mxEvent.consume(e);
		}
	}));
};

/**
 * Adds the label menu items to the given menu and parent.
 */
BaseFormatPanel.prototype.destroy = function()
{
	if (this.listeners != null)
	{
		for (var i = 0; i < this.listeners.length; i++)
		{
			this.listeners[i].destroy();
		}
		
		this.listeners = null;
	}
};

/**
 * Adds the label menu items to the given menu and parent.
 */
ArrangePanel = function(format, editorUi, container)
{
	BaseFormatPanel.call(this, format, editorUi, container);
	this.init();
};

mxUtils.extend(ArrangePanel, BaseFormatPanel);

/**
 * Adds the label menu items to the given menu and parent.
 */
ArrangePanel.prototype.init = function()
{
	var ss = this.editorUi.getSelectionState();

	if (ss.cells.length > 0)
	{
		this.container.appendChild(this.addLayerOps(this.createPanel()));

		// Special case that adds two panels
		var geoSec = this.createCollapsibleSection(mxResources.get('size') +
			' / ' + mxResources.get('position'), false);
		this.addGeometry(geoSec.contentDiv);

		if (geoSec.contentDiv.childNodes.length > 0)
		{
			this.container.appendChild(geoSec.wrapper);
		}

		if (ss.edges.length > 0)
		{
			var edgeGeoSec = this.createCollapsibleSection(mxResources.get('waypoints', null, 'Waypoints'), false);
			this.addEdgeGeometry(edgeGeoSec.contentDiv);
			this.container.appendChild(edgeGeoSec.wrapper);
		}

		if (!ss.containsLabel || ss.edges.length == 0)
		{
			var angleSec = this.createCollapsibleSection(mxResources.get('rotation'), true);
			angleSec.contentDiv.appendChild(this.addAngle(this.createPanel()));
			this.container.appendChild(angleSec.wrapper);
		}

		if (!ss.containsLabel)
		{
			var flipSec = this.createCollapsibleSection(mxResources.get('flip'), true);
			flipSec.contentDiv.appendChild(this.addFlip(this.createPanel()));
			this.container.appendChild(flipSec.wrapper);
		}

		this.container.appendChild(this.addAlign(this.createPanel()));

		if (ss.vertices.length > 1 && !ss.cell && !ss.row)
		{
			this.container.appendChild(this.addDistribute(this.createPanel()));
		}

		var tablePanel = this.addTable(this.createPanel());
		var tableSec = this.createCollapsibleSection(mxResources.get('table'), true);
		tableSec.contentDiv.appendChild(tablePanel);
		this.container.appendChild(tableSec.wrapper);
		this.syncCollapsibleVisibility(tableSec.wrapper, tablePanel);
	}

	// Allows to lock/unload button to be added
	this.container.appendChild(this.addGroupOps(this.createPanel()));
};

/**
 * 
 */
ArrangePanel.prototype.addTable = function(div)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	var ss = ui.getSelectionState();
	var panel = document.createElement('div');
	panel.style.position = 'relative';
	panel.style.paddingLeft = '0px';
	panel.style.borderWidth = '0px';
	panel.style.width = '220px';
	panel.className = 'geToolbarContainer';

	var cell = ss.vertices[0];

	if (graph.getSelectionCount() > 1)
	{
		if (graph.isTableCell(cell))
		{
			cell = graph.model.getParent(cell);
		}

		if (graph.isTableRow(cell))
		{
			cell = graph.model.getParent(cell);
		}
	}

	var isTable = ss.table || ss.row || ss.cell;
	var isStack = graph.isStack(cell) ||
		graph.isStackChild(cell);

	var showCols = isTable;
	var showRows = isTable;

	if (isStack)
	{
		var style = (graph.isStack(cell)) ? ss.style :
			graph.getCellStyle(graph.model.getParent(cell));

		showRows = style['horizontalStack'] == '0';
		showCols = !showRows;
	}

	var btns = [];

	if (showCols)
	{
		btns = btns.concat([
			ui.addButton(Editor.addColumnLeftImage, mxResources.get('insertColumnBefore'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (isStack)
					{
						graph.insertLane(cell, true);
					}
					else
					{
						graph.insertTableColumn(cell, true);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), panel),
			ui.addButton(Editor.addColumnRightImage, mxResources.get('insertColumnAfter'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (isStack)
					{
						graph.insertLane(cell, false);
					}
					else
					{
						graph.insertTableColumn(cell, false);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), panel),
			ui.addButton(Editor.removeColumnImage, mxResources.get('deleteColumn'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (isStack)
					{
						graph.deleteLane(cell);
					}
					else
					{
						graph.deleteTableColumn(cell);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), panel)]);
	}

	if (showRows)
	{
		btns = btns.concat([ui.addButton(Editor.addRowAboveImage, mxResources.get('insertRowBefore'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (isStack)
					{
						graph.insertLane(cell, true);
					}
					else
					{
						graph.insertTableRow(cell, true);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), panel),
			ui.addButton(Editor.addRowBelowImage, mxResources.get('insertRowAfter'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (isStack)
					{
						graph.insertLane(cell, false);
					}
					else
					{
						graph.insertTableRow(cell, false);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), panel),
			ui.addButton(Editor.removeRowImage, mxResources.get('deleteRow'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (isStack)
					{
						graph.deleteLane(cell);
					}
					else
					{
						graph.deleteTableRow(cell);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), panel)]);
	}

	if (btns.length > 0)
	{
		div.appendChild(panel);

		if (btns.length > 3)
		{
			btns[2].style.marginRight = '10px';
		}

		var count = 0;

		if (ss.mergeCell != null)
		{
			count += this.addActions(div, ['mergeCells']);
		}
		else if (ss.style['colspan'] > 1 || ss.style['rowspan'] > 1)
		{
			count += this.addActions(div, ['unmergeCells']);
		}

		if (count > 0)
		{
			panel.style.paddingBottom = '2px';
		}
	}
	else
	{
		div.style.display = 'none';
	}
	
	return div;
};

/**
 * 
 */
ArrangePanel.prototype.addLayerOps = function(div)
{
	this.addActions(div, ['toFront', 'toBack']);
	this.addActions(div, ['bringForward', 'sendBackward']);
	
	return div;
};

/**
 * 
 */
ArrangePanel.prototype.addGroupOps = function(div)
{
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	var ss = ui.getSelectionState();

	var count = this.addActions(div, ['group', 'ungroup']) +
		this.addActions(div, ['removeFromGroup']);

	if (!ss.cell && !ss.row)
	{
		count += this.addActions(div, ['copySize', 'pasteSize', 'swap']);
	}

	var resetSelect = document.createElement('select');
	resetSelect.style.position = 'relative';
	resetSelect.className = 'geFullWidthElement';
	resetSelect.style.marginBottom = '2px';

	var ops = [{label: mxResources.get('reset') + '...', action: 'reset'},
		{label: mxResources.get('waypoints'), action: 'clearWaypoints'},
		{label: mxResources.get('connectionPoints'), action: 'clearAnchors'}];

	for (var i = 0; i < ops.length; i++)
	{
		var action = this.editorUi.actions.get(ops[i].action);

		if (action == null || action.enabled)
		{
			var option = document.createElement('option');
			option.setAttribute('value', ops[i].action);
			option.setAttribute('title', ops[i].label +
				((action != null && action.shortcut != null) ?
					' (' + action.shortcut + ')' : ''));
			mxUtils.write(option, ops[i].label);
			resetSelect.appendChild(option);
		}
	}

	if (resetSelect.children.length > 1)
	{
		resetSelect.value = 'reset';
		div.appendChild(resetSelect);
		mxUtils.br(div);
		count++;

		mxEvent.addListener(resetSelect, 'change', mxUtils.bind(this, function(evt)
		{
			var action = this.editorUi.actions.get(resetSelect.value);
			resetSelect.value = 'reset';

			if (action != null)
			{
				action.funct();
			}
		}));
	}

	count += this.addActions(div, ['lockUnlock']);

	if (ss.vertices.length == 1 && ss.edges.length == 0)
	{
		if (graph.getOpposites(graph.getEdges(ss.vertices[0]),
			ss.vertices[0]).length > 0)
		{
			count += this.addActions(div, ['explore']);
		}
	}

	if (count == 0)
	{
		div.style.display = 'none';
	}
	
	return div;
};

/**
 * 
 */
ArrangePanel.prototype.addAlign = function(div)
{
	var ui = this.editorUi;
	var ss = ui.getSelectionState();
	var graph = ui.editor.graph;
	div.appendChild(this.createTitle(mxResources.get('align')));
	
	if (ss.vertices.length > 1)
	{
		var stylePanel = document.createElement('div');
		stylePanel.className = 'geToolbarContainer';
		ui.addButton(Editor.alignHorizontalLeftImage, mxResources.get('left'),
			function() { graph.alignCells(mxConstants.ALIGN_LEFT); }, stylePanel).
			style.marginLeft = '6px';
		ui.addButton(Editor.alignHorizontalCenterImage, mxResources.get('center'),
			function() { graph.alignCells(mxConstants.ALIGN_CENTER); }, stylePanel);
		ui.addButton(Editor.alignHorizontalRightImage, mxResources.get('right'),
			function() { graph.alignCells(mxConstants.ALIGN_RIGHT); }, stylePanel);
		
		ui.addButton(Editor.alignVerticalTopImage, mxResources.get('top'),
			function() { graph.alignCells(mxConstants.ALIGN_TOP); }, stylePanel).
			style.marginLeft = '12px';
		ui.addButton(Editor.alignVerticalMiddleImage, mxResources.get('middle'),
			function() { graph.alignCells(mxConstants.ALIGN_MIDDLE); }, stylePanel);
		ui.addButton(Editor.alignVerticalBottomImage, mxResources.get('bottom'),
			function() { graph.alignCells(mxConstants.ALIGN_BOTTOM); }, stylePanel);
		div.appendChild(stylePanel);
	}

	this.addActions(div, ['snapToGrid']);
	
	return div;
};

/**
 * 
 */
ArrangePanel.prototype.addFlip = function(div)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	var ss = this.editorUi.getSelectionState();

	var span = document.createElement('div');
	span.className = 'geFormatSectionTitle';
	mxUtils.write(span, mxResources.get('flip'));
	span.setAttribute('title', mxResources.get('flip'));
	div.appendChild(span);
	
	var btn = mxUtils.button(mxResources.get('horizontal'), function(evt)
	{
		graph.flipCells(ss.cells, true);
	})
	
	btn.setAttribute('title', mxResources.get('horizontal'));
	btn.style.width = '104px';
	btn.style.marginRight = '2px';
	div.appendChild(btn);
	
	var btn = mxUtils.button(mxResources.get('vertical'), function(evt)
	{
		graph.flipCells(ss.cells, false);
	})
	
	btn.setAttribute('title', mxResources.get('vertical'));
	btn.style.width = '104px';
	div.appendChild(btn);
	
	return div;
};

/**
 * 
 */
ArrangePanel.prototype.addDistribute = function(div)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	
	div.appendChild(this.createTitle(mxResources.get('distribute')));

	var btn = mxUtils.button(mxResources.get('horizontal'), function(evt)
	{
		graph.distributeCells(true, null, cb.checked);
	})
	
	btn.setAttribute('title', mxResources.get('horizontal'));
	btn.style.width = '104px';
	btn.style.marginRight = '2px';
	div.appendChild(btn);
	
	var btn = mxUtils.button(mxResources.get('vertical'), function(evt)
	{
		graph.distributeCells(false, null, cb.checked);
	})
	
	btn.setAttribute('title', mxResources.get('vertical'));
	btn.style.width = '104px';
	div.appendChild(btn);
	
	mxUtils.br(div);

	var panel = document.createElement('div');
	panel.style.margin = '6px 0 0 0';
	panel.style.display = 'flex';
	panel.style.justifyContent = 'center';
	panel.style.alignItems = 'center';

	var cb = document.createElement('input');
	cb.setAttribute('type', 'checkbox');
	cb.setAttribute('id', 'spacingCheckbox');
	cb.setAttribute('title', mxResources.get('spacing'));
	cb.style.margin = '0 6px 0 0';
	panel.appendChild(cb);

	var label = document.createElement('label');
	label.style.verticalAlign = 'top';
	label.setAttribute('for', 'spacingCheckbox');
	label.setAttribute('title', mxResources.get('spacing'));
	label.style.userSelect = 'none';
	mxUtils.write(label, mxResources.get('spacing'));
	panel.appendChild(label);
	div.appendChild(panel);

	return div;
};

/**
 * 
 */
ArrangePanel.prototype.addAngle = function(div)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	var ss = ui.getSelectionState();

	var span = document.createElement('div');
	span.style.position = 'absolute';
	span.style.marginTop = '4px';
	span.style.width = '70px';
	span.style.fontWeight = 'bold';
	div.style.minHeight = '20px';
	
	var input = null;
	var update = null;
	var btn = null;
	
	if (ss.rotatable && !ss.table && !ss.row && !ss.cell)
	{
		mxUtils.write(span, mxResources.get('angle'));
		span.setAttribute('title', mxResources.get('angle'));
		div.appendChild(span);
		
		input = this.addUnitInput(div, '°', 16, 52, function()
		{
			update.apply(this, arguments);
		});
		input.setAttribute('title', mxResources.get('angle'));

		mxUtils.br(div);
	}

	if (!ss.containsLabel)
	{
		var label = mxResources.get('reverse');
		
		if (ss.vertices.length > 0 && ss.edges.length > 0)
		{
			label = mxResources.get('turn') + ' / ' + label;
		}
		else if (ss.vertices.length > 0)
		{
			label = mxResources.get('turn');
		}

		btn = mxUtils.button(label, function(evt)
		{
			ui.actions.get('turn').funct(evt);
		})
		
		btn.setAttribute('title', label + ' (' + this.editorUi.actions.get('turn').shortcut + ')');
		btn.className = 'geFullWidthElement';
		div.appendChild(btn);
		
		if (input != null)
		{
			btn.style.marginTop = '10px';
		}
	}
	
	if (input != null)
	{
		var listener = mxUtils.bind(this, function(sender, evt, force)
		{
			if (force || document.activeElement != input)
			{
				ss = ui.getSelectionState();
				var tmp = parseFloat(mxUtils.getValue(ss.style, mxConstants.STYLE_ROTATION, 0));
				input.value = (isNaN(tmp)) ? '' : tmp  + '°';
			}
		});
	
		update = this.installInputHandler(input, mxConstants.STYLE_ROTATION, 0, 0, 360, '°', null, true);
		this.addKeyHandler(input, listener);
	
		graph.getModel().addListener(mxEvent.CHANGE, listener);
		this.listeners.push({destroy: function() { graph.getModel().removeListener(listener); }});
		listener();
	}

	return div;
};

/**
 * 
 */
BaseFormatPanel.prototype.getUnit = function(prefix)
{
	var unit = this.editorUi.editor.graph.view.unit;
	var retUnit = '';
	
	switch(unit)
	{
		case mxConstants.POINTS:
			retUnit = 'pt';
			break;
		case mxConstants.INCHES:
			retUnit = '"';
			break;
		case mxConstants.MILLIMETERS:
			retUnit = 'mm';
			break;
		case mxConstants.METERS:
			retUnit = 'm';
	}

	return (prefix? prefix : '') + retUnit;
};

/**
 * 
 */
BaseFormatPanel.prototype.inUnit = function(pixels)
{
	return this.editorUi.editor.graph.view.formatUnitText(pixels);
};

/**
 * 
 */
BaseFormatPanel.prototype.fromUnit = function(value)
{
	var unit = this.editorUi.editor.graph.view.unit;
	
	switch(unit)
	{
		case mxConstants.POINTS:
			return value;
		case mxConstants.INCHES:
			return value * mxConstants.PIXELS_PER_INCH;
		case mxConstants.MILLIMETERS:
			return value * mxConstants.PIXELS_PER_MM;
		case mxConstants.METERS:
			return value * mxConstants.PIXELS_PER_MM * 1000;
	}
};

BaseFormatPanel.prototype.isFloatUnit = function()
{
	return this.editorUi.editor.graph.view.unit != mxConstants.POINTS;
};

/**
 * 
 */
BaseFormatPanel.prototype.getUnitStep = function()
{
	var unit = this.editorUi.editor.graph.view.unit;
	
	switch(unit)
	{
		case mxConstants.POINTS:
			return 1;
		case mxConstants.INCHES:
			return 0.1;
		case mxConstants.MILLIMETERS:
			return 0.5;
		case mxConstants.METERS:
			return 0.001;
	}
};

/**
 * 
 */
ArrangePanel.prototype.addGeometry = function(container)
{
	var panel = this;
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	var model = graph.getModel();
	var rect = ui.getSelectionState();

	var div = this.createPanel();
	div.style.height = '60px';
		
	var span = document.createElement('div');
	span.className = 'geStyleLabel';
	span.style.position = 'absolute';
	span.style.fontWeight = 'bold';
	span.style.marginTop = '4px';
	span.style.maxWidth = '50px';
	mxUtils.write(span, mxResources.get('size'));
	span.setAttribute('title', mxResources.get('size'));
	div.appendChild(span);

	var widthUpdate, heightUpdate, leftUpdate, topUpdate;
	var width = this.addUnitInput(div, this.getUnit(), 87, 52, function()
	{
		widthUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	width.setAttribute('title', mxResources.get('width'));
	var height = this.addUnitInput(div, this.getUnit(), 16, 52, function()
	{
		heightUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	height.setAttribute('title', mxResources.get('height'));
	
	var autosizeBtn = document.createElement('div');
	autosizeBtn.style.backgroundImage = 'url(' + Editor.autosizeImage + ')';
	autosizeBtn.className = 'geButton';
	autosizeBtn.style.margin = '0';
	autosizeBtn.style.width = '21px';
	autosizeBtn.style.height = '21px';
	autosizeBtn.style.left = '52px';
	mxUtils.setOpacity(autosizeBtn, 50);
	autosizeBtn.setAttribute('title', mxResources.get('autosize'));

	mxEvent.addListener(autosizeBtn, 'click', function()
	{
		ui.actions.get('autosize').funct();
	});

	div.appendChild(autosizeBtn);
	
	if (rect.row)
	{
		width.style.visibility = 'hidden';
		width.nextSibling.style.visibility = 'hidden';
	}
	else
	{
		this.addLabel(div, mxResources.get('width'), 87, 64).style.marginTop = '0px';
	}
	
	this.addLabel(div, mxResources.get('height'), 16, 64).style.marginTop = '0px';
	mxUtils.br(div);

	var wrapper = document.createElement('div');
	wrapper.className = 'geFormatEntry';
	wrapper.style.marginTop = '14px';
	var opt = this.createCellOption(mxResources.get('constrainProportions'),
		mxConstants.STYLE_ASPECT, null, 'fixed', 'null');
	opt.className = 'geFullWidthElement';
	wrapper.appendChild(opt);
		
	if (!rect.cell && !rect.row)
	{
		div.appendChild(wrapper);
	}
	else
	{
		autosizeBtn.style.visibility = 'hidden';
	}
	
	var constrainCheckbox = opt.getElementsByTagName('input')[0];
	this.addKeyHandler(width, listener);
	this.addKeyHandler(height, listener);
	
	widthUpdate = this.addGeometryHandler(width, function(geo, value, cell)
	{
		value = Math.max(1, panel.fromUnit(value));
		
		if (graph.isTableCell(cell))
		{
			graph.setTableColumnWidth(cell, value - geo.width, true);
			
			// Blocks processing in caller
			return true;
		}
		else if (geo.width > 0)
		{
			if (constrainCheckbox.checked)
			{
				geo.height = Math.round((geo.height * value * 100) / geo.width) / 100;
			}
			
			geo.width = value;
		}
	});
	heightUpdate = this.addGeometryHandler(height, function(geo, value, cell)
	{
		value = Math.max(1, panel.fromUnit(value));
		
		if (graph.isTableCell(cell))
		{
			cell = model.getParent(cell);
		}
		
		if (graph.isTableRow(cell))
		{
			graph.setTableRowHeight(cell, value - geo.height);
			
			// Blocks processing in caller
			return true;
		}
		else if (geo.height > 0)
		{
			if (constrainCheckbox.checked)
			{
				geo.width = Math.round((geo.width  * value * 100) / geo.height) / 100;
			}
			
			geo.height = value;
		}
	});
	
	if (rect.resizable || rect.row || rect.cell)
	{
		container.appendChild(div);
	}
	
	var div2 = this.createPanel();
	div2.style.paddingBottom = '30px';
	
	var span = document.createElement('div');
	span.style.position = 'absolute';
	span.style.width = '70px';
	span.style.marginTop = '0px';
	span.style.fontWeight = 'bold';
	mxUtils.write(span, mxResources.get('position'));
	span.setAttribute('title', mxResources.get('position'));
	div2.appendChild(span);

	var left = this.addUnitInput(div2, this.getUnit(), 87, 52, function()
	{
		leftUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	var top = this.addUnitInput(div2, this.getUnit(), 16, 52, function()
	{
		topUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());

	mxUtils.br(div2);
	
	var coordinateLabels = true;
	var dx = null;
	var dy = null;

	if (rect.movable)
	{
		if (rect.edges.length == 0 && rect.vertices.length == 1)
		{
			var geo = graph.getCellGeometry(rect.vertices[0]);

			if (geo != null && geo.relative)
			{
				mxUtils.br(div2);

				var span = document.createElement('div');
				span.style.position = 'absolute';
				span.style.width = '70px';
				span.style.marginTop = '0px';
				mxUtils.write(span, mxResources.get('relative'));
				span.setAttribute('title', mxResources.get('relative'));
				div2.appendChild(span);

				dx = this.addGenericInput(div2, ' %', 87, 52, function()
				{
					return (Math.round(geo.x * 1000) / 10);
				}, function(value)
				{
					value = parseFloat(value);
					
					if (!isNaN(value))
					{
						model.beginUpdate();
						try
						{
							geo = geo.clone();
							geo.x = parseFloat(value) / 100;
							model.setGeometry(rect.vertices[0], geo);
						}
						finally
						{
							model.endUpdate();
						}
					}
				});
				dx.setAttribute('title', mxResources.get('relative'));

				if (model.isEdge(model.getParent(rect.vertices[0])))
				{
					coordinateLabels = false;
					var dyUpdate = null;

					dy = this.addUnitInput(div2, this.getUnit(), 16, 52, function()
					{
						dyUpdate.apply(this, arguments);
					});
					dy.setAttribute('title', mxResources.get('orthogonal'));

					dyUpdate = this.addGeometryHandler(dy, function(geo, value)
					{
						geo.y = panel.fromUnit(value);
					});
				}
				else
				{
					dy = this.addGenericInput(div2, ' %', 16, 52, function()
					{
						return (Math.round(geo.y * 1000) / 10);
					}, function(value)
					{
						value = parseFloat(value);
						
						if (!isNaN(value))
						{
							model.beginUpdate();
							try
							{
								geo = geo.clone();
								geo.y = parseFloat(value) / 100;
								model.setGeometry(rect.vertices[0], geo);
							}
							finally
							{
								model.endUpdate();
							}
						}
					});
				}

				mxUtils.br(div2);
			}
		}
		container.appendChild(div2);
	}

	this.addLabel(div2, mxResources.get(coordinateLabels ? 'left' : 'line'), 87, 64);
	this.addLabel(div2, mxResources.get(coordinateLabels ? 'top' : 'orthogonal'), 16, 64);
	left.setAttribute('title', mxResources.get(coordinateLabels ? 'left' : 'line'));
	top.setAttribute('title', mxResources.get(coordinateLabels ? 'top' : 'orthogonal'));

	var listener = mxUtils.bind(this, function(sender, evt, force)
	{
		rect = ui.getSelectionState();

		if (!rect.containsLabel && rect.vertices.length == graph.getSelectionCount() &&
			rect.width != null && rect.height != null)
		{
			div.style.display = '';
			
			if (force || document.activeElement != width)
			{
				width.value = this.inUnit(rect.width) + ' ' + this.getUnit();
			}
			
			if (force || document.activeElement != height)
			{
				height.value = this.inUnit(rect.height) + ' ' + this.getUnit();
			}
		}
		else
		{
			div.style.display = 'none';
		}
		
		if (rect.vertices.length == graph.getSelectionCount() &&
			rect.vertices.length > 0 && rect.x != null &&
			rect.y != null)
		{
			var geo = graph.getCellGeometry(rect.vertices[0]);
			div2.style.display = '';
			
			if (force || document.activeElement != left)
			{
				left.value = this.inUnit(rect.x) + ' ' + this.getUnit();
			}
			
			if (force || document.activeElement != top)
			{
				top.value = this.inUnit(rect.y) + ' ' + this.getUnit();
			}

			if (geo != null && geo.relative)
			{
				if (dx != null && (force || document.activeElement != dx))
				{
					dx.value = (Math.round(geo.x * 1000) / 10) + ' %';
				}

				if (dy != null && (force || document.activeElement != dy))
				{
					if (model.isEdge(model.getParent(rect.vertices[0])))
					{
						dy.value = this.inUnit(geo.y) + ' ' + this.getUnit();
					}
					else
					{
						dy.value = (Math.round(geo.y * 1000) / 10) + ' %';
					}
				}
			}
		}
		else
		{
			div2.style.display = 'none';
		}
	});

	this.listeners.push({destroy: function() { model.removeListener(listener); }});
	model.addListener(mxEvent.CHANGE, listener);
	this.addKeyHandler(left, listener);
	this.addKeyHandler(top, listener);
	listener();
	
	leftUpdate = this.addGeometryHandler(left, function(geo, value)
	{
		value = panel.fromUnit(value);
		
		if (geo.relative)
		{
			geo.offset = (geo.offset != null) ? geo.offset : new mxPoint();
			geo.offset.x = value;
		}
		else
		{
			geo.x = value;
		}
	});
	topUpdate = this.addGeometryHandler(top, function(geo, value)
	{
		value = panel.fromUnit(value);
		
		if (geo.relative)
		{
			geo.offset = (geo.offset != null) ? geo.offset : new mxPoint();
			geo.offset.y = value;
		}
		else
		{
			geo.y = value;
		}
	});

	if (rect.movable)
	{
		if (rect.edges.length == 0 && rect.vertices.length == 1 &&
			model.isEdge(model.getParent(rect.vertices[0])))
		{
			var geo = graph.getCellGeometry(rect.vertices[0]);
			
			if (geo != null && geo.relative)
			{
				// Adds move drop down with center, start and end options
				var moveSelect = document.createElement('select');
				moveSelect.setAttribute('title', mxResources.get('move'));
				moveSelect.style.position = 'absolute';
				moveSelect.style.width = '134px';
				moveSelect.style.left = '77px';

				var titleOption = document.createElement('option');
				titleOption.setAttribute('value', 'none');
				titleOption.setAttribute('title', mxResources.get('move'));
				mxUtils.write(titleOption, mxResources.get('move') + '...');
				moveSelect.appendChild(titleOption);

				var startOption = document.createElement('option');
				startOption.setAttribute('value', 'start');
				startOption.setAttribute('title', mxResources.get('linestart'));
				mxUtils.write(startOption, mxResources.get('linestart'));
				moveSelect.appendChild(startOption);

				var centerOption = document.createElement('option');
				centerOption.setAttribute('value', 'center');
				centerOption.setAttribute('title', mxResources.get('center'));
				mxUtils.write(centerOption, mxResources.get('center'));
				moveSelect.appendChild(centerOption);

				var endOption = document.createElement('option');
				endOption.setAttribute('value', 'end');
				endOption.setAttribute('title', mxResources.get('lineend'));
				mxUtils.write(endOption, mxResources.get('lineend'));
				moveSelect.appendChild(endOption);

				mxEvent.addListener(moveSelect, 'change', function(evt)
				{
					if (moveSelect.value != 'none')
					{
						model.beginUpdate();
						try
						{
							geo = geo.clone();

							if (moveSelect.value == 'start')
							{
								geo.x = -1;
							}
							else if (moveSelect.value == 'end')
							{
								geo.x = 1;
							}
							else
							{
								geo.x = 0;
							}

							geo.y = 0;
							geo.offset = new mxPoint();
							model.setGeometry(rect.vertices[0], geo);
						}
						finally
						{
							model.endUpdate();
						}	
					}

					moveSelect.value = 'none';
				});
				
				mxUtils.br(div2);
				mxUtils.br(div2);
				div2.appendChild(moveSelect);
			}
		}
		container.appendChild(div2);
	}
};

/**
 * 
 */
ArrangePanel.prototype.addGeometryHandler = function(input, fn)
{
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	var initialValue = null;
	var panel = this;
	
	function update(evt)
	{
		if (input.value != '')
		{
			var value = parseFloat(input.value);

			if (isNaN(value)) 
			{
				input.value = initialValue + ' ' + panel.getUnit();
			}
			else if (value != initialValue)
			{
				graph.getModel().beginUpdate();
				try
				{
					var cells = ui.getSelectionState().cells;
					
					for (var i = 0; i < cells.length; i++)
					{
						if (graph.getModel().isVertex(cells[i]))
						{
							var geo = graph.getCellGeometry(cells[i]);
							
							if (geo != null)
							{
								geo = geo.clone();
								
								if (!fn(geo, value, cells[i]))
								{
									var state = graph.view.getState(cells[i]);
									
									if (state != null && graph.isRecursiveVertexResize(state))
									{
										graph.resizeChildCells(cells[i], geo);
									}
									
									graph.getModel().setGeometry(cells[i], geo);
									graph.constrainChildCells(cells[i]);
								}
							}
						}
					}
				}
				finally
				{
					graph.getModel().endUpdate();
				}
				
				initialValue = value;
				input.value = value + ' ' + panel.getUnit();
			}
		}
		
		mxEvent.consume(evt);
	};

	mxEvent.addListener(input, 'blur', update);
	mxEvent.addListener(input, 'change', update);
	mxEvent.addListener(input, 'focus', function()
	{
		initialValue = input.value;
	});
	
	return update;
};

ArrangePanel.prototype.addEdgeGeometryHandler = function(input, fn)
{
    var ui = this.editorUi;
    var graph = ui.editor.graph;
    var initialValue = null;

    function update(evt)
    {
        if (input.value != '')
        {
            var value = parseFloat(input.value);

            if (isNaN(value))
            {
                input.value = initialValue + ' pt';
            }
            else if (value != initialValue)
            {
                graph.getModel().beginUpdate();
                try
                {
                    var cells = ui.getSelectionState().cells;

                    for (var i = 0; i < cells.length; i++)
                    {
                        if (graph.getModel().isEdge(cells[i]))
                        {
                            var geo = graph.getCellGeometry(cells[i]);

                            if (geo != null)
                            {
                                geo = geo.clone();
                                fn(geo, value);

                                graph.getModel().setGeometry(cells[i], geo);
                            }
                        }
                    }
                }
                finally
                {
                    graph.getModel().endUpdate();
                }

                initialValue = value;
                input.value = value + ' pt';
            }
        }

        mxEvent.consume(evt);
    };

    mxEvent.addListener(input, 'blur', update);
    mxEvent.addListener(input, 'change', update);
    mxEvent.addListener(input, 'focus', function()
    {
        initialValue = input.value;
    });

    return update;
};

/**
 * 
 */
ArrangePanel.prototype.addEdgeGeometry = function(container)
{
	var panel = this;
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	var rect = ui.getSelectionState();
	var div = this.createPanel();
	
	var span = document.createElement('div');
	span.style.position = 'absolute';
	span.style.width = '70px';
	span.style.marginTop = '0px';
	span.style.fontWeight = 'bold';
	mxUtils.write(span, mxResources.get('width'));
	span.setAttribute('title', mxResources.get('width'));
	div.appendChild(span);

	var widthUpdate, xtUpdate, ytUpdate, xsUpdate, ysUpdate;
	var width = this.addUnitInput(div, 'pt', 12, 44, function()
	{
		widthUpdate.apply(this, arguments);
	});
	width.setAttribute('title', mxResources.get('width'));

	mxUtils.br(div);
	this.addKeyHandler(width, listener);
	
	var widthUpdate = mxUtils.bind(this, function(evt)
	{
		// Maximum stroke width is 999
		var value = parseInt(width.value);
		value = Math.min(999, Math.max(1, (isNaN(value)) ? 1 : value));
		
		if (value != mxUtils.getValue(rect.style, 'width', mxCellRenderer.defaultShapes['flexArrow'].prototype.defaultWidth))
		{
			var cells = ui.getSelectionState().cells;
			graph.setCellStyles('width', value, cells);
			ui.fireEvent(new mxEventObject('styleChanged', 'keys', ['width'],
					'values', [value], 'cells', cells));
		}

		width.value = value + ' pt';
		mxEvent.consume(evt);
	});

	mxEvent.addListener(width, 'blur', widthUpdate);
	mxEvent.addListener(width, 'change', widthUpdate);

	container.appendChild(div);

	var divs = this.createPanel();
	divs.style.paddingBottom = '30px';

	var span = document.createElement('div');
	span.style.position = 'absolute';
	span.style.width = '70px';
	span.style.marginTop = '4px';
	mxUtils.write(span, mxResources.get('linestart'));
	span.setAttribute('title', mxResources.get('linestart'));
	divs.appendChild(span);

	var xs = this.addUnitInput(divs, this.getUnit(), 87, 52, function()
	{
		xsUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	xs.setAttribute('title', mxResources.get('left'));
	var ys = this.addUnitInput(divs, this.getUnit(), 16, 52, function()
	{
		ysUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	ys.setAttribute('title', mxResources.get('top'));

	mxUtils.br(divs);
	this.addLabel(divs, mxResources.get('left'), 87, 64);
	this.addLabel(divs, mxResources.get('top'), 16, 64);
	container.appendChild(divs);
	this.addKeyHandler(xs, listener);
	this.addKeyHandler(ys, listener);

	var divt = this.createPanel();
	divt.style.paddingBottom = '30px';

	var span = document.createElement('div');
	span.style.position = 'absolute';
	span.style.width = '70px';
	span.style.marginTop = '4px';
	mxUtils.write(span, mxResources.get('lineend'));
	span.setAttribute('title', mxResources.get('lineend'));
	divt.appendChild(span);

	var xt = this.addUnitInput(divt, this.getUnit(), 87, 52, function()
	{
		xtUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	xt.setAttribute('title', mxResources.get('left'));
	var yt = this.addUnitInput(divt, this.getUnit(), 16, 52, function()
	{
		ytUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	yt.setAttribute('title', mxResources.get('top'));

	mxUtils.br(divt);
	this.addLabel(divt, mxResources.get('left'), 87, 64);
	this.addLabel(divt, mxResources.get('top'), 16, 64);
	container.appendChild(divt);
	this.addKeyHandler(xt, listener);
	this.addKeyHandler(yt, listener);

	var listener = mxUtils.bind(this, function(sender, evt, force)
	{
		rect = ui.getSelectionState();
		var cell = rect.cells[0];
		
		if (rect.style.shape == 'link' || rect.style.shape == 'flexArrow')
		{
			div.style.display = '';
			
			if (force || document.activeElement != width)
			{
				var value = mxUtils.getValue(rect.style, 'width',
					mxCellRenderer.defaultShapes['flexArrow'].prototype.defaultWidth);
				width.value = value + ' pt';
			}
		}
		else
		{
			div.style.display = 'none';
		}

		if (rect.cells.length == 1 && graph.model.isEdge(cell))
		{
			var geo = graph.model.getGeometry(cell);
			
			if (geo != null && geo.sourcePoint != null &&
				graph.model.getTerminal(cell, true) == null)
			{
				xs.value = this.inUnit(geo.sourcePoint.x) + ' ' + this.getUnit();
				ys.value = this.inUnit(geo.sourcePoint.y) + ' ' + this.getUnit();
			}
			else
			{
				divs.style.display = 'none';
			}
			
			if (geo != null && geo.targetPoint != null &&
				graph.model.getTerminal(cell, false) == null)
			{
				xt.value = this.inUnit(geo.targetPoint.x) + ' ' + this.getUnit();
				yt.value = this.inUnit(geo.targetPoint.y) + ' ' + this.getUnit();
			}
			else
			{
				divt.style.display = 'none';
			}
		}
		else
		{
			divs.style.display = 'none';
			divt.style.display = 'none';
		}
	});

	xsUpdate = this.addEdgeGeometryHandler(xs, function(geo, value)
	{
		if (geo.sourcePoint != null)
		{
			geo.sourcePoint.x = panel.fromUnit(value);
		}
	});

	ysUpdate = this.addEdgeGeometryHandler(ys, function(geo, value)
	{
		if (geo.sourcePoint != null)
		{
			geo.sourcePoint.y = panel.fromUnit(value);
		}
	});

	xtUpdate = this.addEdgeGeometryHandler(xt, function(geo, value)
	{
		if (geo.targetPoint != null)
		{
			geo.targetPoint.x = panel.fromUnit(value);
		}
	});

	ytUpdate = this.addEdgeGeometryHandler(yt, function(geo, value)
	{
		if (geo.targetPoint != null)
		{
			geo.targetPoint.y = panel.fromUnit(value);
		}
	});

	graph.getModel().addListener(mxEvent.CHANGE, listener);
	this.listeners.push({destroy: function() { graph.getModel().removeListener(listener); }});
	listener();
};

/**
 * Adds the label menu items to the given menu and parent.
 */
TextFormatPanel = function(format, editorUi, container)
{
	BaseFormatPanel.call(this, format, editorUi, container);
	this.init();
};

mxUtils.extend(TextFormatPanel, BaseFormatPanel);

/**
 * Adds the label menu items to the given menu and parent.
 */
TextFormatPanel.prototype.init = function()
{
	this.container.appendChild(this.addFont(this.createPanel()));
	this.container.appendChild(this.addFontOps(this.createPanel()));
};


/**
 * 
 */
TextFormatPanel.prototype.addFontOps = function(div)
{
	var count = this.addActions(div, ['removeFormat']);

	if (count == 0)
	{
		div.style.display = 'none';
	}
	
	return div;
};


/**
 * Adds the label menu items to the given menu and parent.
 */
TextFormatPanel.prototype.addFont = function(container)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	var ss = ui.getSelectionState();
	
	var title = this.createTitle(mxResources.get('font'));
	container.appendChild(title);

	var stylePanel = this.createPanel();
	stylePanel.className = 'geFormatEntry';
	
	if (graph.cellEditor.isContentEditing())
	{
		var cssPanel = stylePanel.cloneNode();
		
		var cssMenu = ui.toolbar.addMenu(
			ui.menus.get('formatBlock'),
			mxResources.get('style'), null, cssPanel);
		this.addArrow(cssMenu);
		cssMenu.style.margin = '0px';
		cssMenu.style.position = 'relative';
		cssMenu.classList.add('geFullWidthElement');
		container.appendChild(cssPanel);
	}
	
	var fontFamilyPanel = stylePanel.cloneNode(false);
	container.appendChild(fontFamilyPanel);
	
	var colorPanel = this.createPanel();
	var fontMenu = ui.toolbar.addMenu(
		ui.menus.get('fontFamily'),
		'Helvetica', null, fontFamilyPanel);
	this.addArrow(fontMenu);
	fontMenu.setAttribute('title', mxResources.get('fontFamily'));
	fontMenu.style.margin = '0px';
	fontMenu.style.position = 'relative';
	fontMenu.classList.add('geFullWidthElement');

	if (ss.style[mxConstants.STYLE_FONTFAMILY] == 'inherit')
	{
		fontFamilyPanel.style.display = 'none';
	}
	
	var stylePanel2 = stylePanel.cloneNode(false);
	var fontStyleItems = ui.toolbar.addItems(['bold', 'italic', 'underline'], stylePanel2, true,
		[Editor.boldImage, Editor.italicImage, Editor.underlineImage]);
	fontStyleItems[0].setAttribute('title', mxResources.get('bold') + ' (' + ui.actions.get('bold').shortcut + ')');
	fontStyleItems[1].setAttribute('title', mxResources.get('italic') + ' (' + ui.actions.get('italic').shortcut + ')');
	fontStyleItems[2].setAttribute('title', mxResources.get('underline') + ' (' + ui.actions.get('underline').shortcut + ')');
	
	var verticalItem = ui.toolbar.addItems(['vertical'], stylePanel2, true, [Editor.verticalTextImage])[0];
	container.appendChild(stylePanel2);

	var stylePanel3 = stylePanel.cloneNode(false);
	
	// Helper function to return a wrapper function does not pass any arguments
	var callFn = function(fn)
	{
		return function()
		{
			return fn();
		};
	};
	
	var left = ui.addButton(Editor.alignLeftImage, mxResources.get('left'),
		(graph.cellEditor.isContentEditing()) ?
		function(evt)
		{
			graph.cellEditor.alignText(mxConstants.ALIGN_LEFT, evt);
			ui.fireEvent(new mxEventObject('styleChanged',
				'keys', [mxConstants.STYLE_ALIGN],
				'values', [mxConstants.ALIGN_LEFT],
				'cells', ss.cells));
		} : callFn(ui.menus.createStyleChangeFunction([mxConstants.STYLE_ALIGN], [mxConstants.ALIGN_LEFT])), stylePanel3);
	var center = ui.addButton(Editor.alignCenterImage, mxResources.get('center'),
		(graph.cellEditor.isContentEditing()) ?
		function(evt)
		{
			graph.cellEditor.alignText(mxConstants.ALIGN_CENTER, evt);
			ui.fireEvent(new mxEventObject('styleChanged',
				'keys', [mxConstants.STYLE_ALIGN],
				'values', [mxConstants.ALIGN_CENTER],
				'cells', ss.cells));
		} : callFn(ui.menus.createStyleChangeFunction([mxConstants.STYLE_ALIGN], [mxConstants.ALIGN_CENTER])), stylePanel3);
	var right = ui.addButton(Editor.alignRightImage, mxResources.get('right'),
		(graph.cellEditor.isContentEditing()) ?
		function(evt)
		{
			graph.cellEditor.alignText(mxConstants.ALIGN_RIGHT, evt);
			ui.fireEvent(new mxEventObject('styleChanged',
				'keys', [mxConstants.STYLE_ALIGN],
				'values', [mxConstants.ALIGN_RIGHT],
				'cells', ss.cells));
		} : callFn(ui.menus.createStyleChangeFunction([mxConstants.STYLE_ALIGN], [mxConstants.ALIGN_RIGHT])), stylePanel3);
	
	// Returns the absolute font size for the given computed style
	function getAbsoluteFontSize(css)
	{
		var fontSize = (css != null) ? css.fontSize : null;
			
		if (fontSize != null && fontSize.substring(fontSize.length - 2) == 'px')
		{
			return parseFloat(fontSize);
		}
		else
		{
			return mxConstants.DEFAULT_FONTSIZE;
		}
	};

	// Sets or removes the line height on the given element
	function setLineHeight(elt, value)
	{
		if (elt != null && elt.textContent != '')
		{
			elt.style.lineHeight = '';
			var css = mxUtils.getCurrentStyle(elt);
			var lh = parseFloat(css.fontSize) * value / 100;

			if (lh != parseFloat(css.lineHeight))
			{
				elt.style.lineHeight = value + '%';
			}
			else if (elt.getAttribute('style') == '')
			{
				elt.removeAttribute('style');
			}
		}
	};
	
	// Quick hack for strikethrough
	// TODO: Add translations and toggle state
	if (graph.cellEditor.isContentEditing())
	{
		strike = ui.addButton(Editor.strikethroughImage, mxResources.get('strikethrough'),
			function()
			{
				document.execCommand('strikeThrough', false, null);
			}, stylePanel2);
	}
	
	var top = ui.addButton(Editor.alignTopImage, mxResources.get('top'),
		callFn(ui.menus.createStyleChangeFunction([mxConstants.STYLE_VERTICAL_ALIGN],
			[mxConstants.ALIGN_TOP])), stylePanel3);
	var middle = ui.addButton(Editor.alignMiddleImage, mxResources.get('middle'),
		callFn(ui.menus.createStyleChangeFunction([mxConstants.STYLE_VERTICAL_ALIGN],
			[mxConstants.ALIGN_MIDDLE])), stylePanel3);
	var bottom = ui.addButton(Editor.alignBottomImage, mxResources.get('bottom'),
		callFn(ui.menus.createStyleChangeFunction([mxConstants.STYLE_VERTICAL_ALIGN],
			[mxConstants.ALIGN_BOTTOM])), stylePanel3);
	
	container.appendChild(stylePanel3);
	
	// Hack for updating UI state below based on current text selection
	// currentTable is the current selected DOM table updated below
	var sub, sup, strike, full, tableWrapper, currentTable, tableCell, tableRow;
	
	if (graph.cellEditor.isContentEditing())
	{
		top.style.display = 'none';
		middle.style.display = 'none';
		bottom.style.display = 'none';
		verticalItem.style.display = 'none';
		
		full = ui.addButton(Editor.alignJustifyImage, mxResources.get('block'),
			function()
			{
				document.execCommand('justifyfull', false, null);
			}, stylePanel3);
		full.style.marginRight = '9px';

		sub = ui.addButton(Editor.subscriptImage,
			mxResources.get('subscript') + ' (' + Editor.ctrlKey + '+,)',
			function()
			{
				document.execCommand('subscript', false, null);
			}, stylePanel3)
		sub.style.marginLeft = '10px';	

		sup = ui.addButton(Editor.superscriptImage,
			mxResources.get('superscript') + ' (' + Editor.ctrlKey + '+.)',
		function()
		{
			document.execCommand('superscript', false, null);
		}, stylePanel3)
		sub.style.marginLeft = '10px';
		
		var tmp = stylePanel3.cloneNode(false);
		tmp.style.paddingTop = '4px';
		var btns = [ui.addButton(Editor.orderedListImage, mxResources.get('numberedList'),
				function()
				{
					document.execCommand('insertorderedlist', false, null);
				}, tmp),
			ui.addButton(Editor.unorderedListImage, mxResources.get('bulletedList'),
				function()
				{
					document.execCommand('insertunorderedlist', false, null);
				}, tmp),
			ui.addButton(Editor.indentImage, mxResources.get('increaseIndent'),
				function()
				{
					document.execCommand('indent', false, null);
				}, tmp),
			ui.addButton(Editor.outdentImage, mxResources.get('decreaseIndent'),
				function()
				{
					document.execCommand('outdent', false, null);
				}, tmp),
			ui.addButton(Editor.removeFormatImage, mxResources.get('removeFormat'),
				function()
				{
					document.execCommand('removeformat', false, null);
				}, tmp),
			ui.addButton(Editor.codeImage, mxResources.get('html'),
				function()
				{
					graph.cellEditor.toggleViewMode();
				}, tmp)];
		btns[btns.length - 2].style.marginLeft = '10px';
		
		container.appendChild(tmp);
	}
	else
	{
		fontStyleItems[2].style.marginRight = '12px';
		right.style.marginRight = '12px';
	}
	
	// Label position
	var stylePanel4 = stylePanel.cloneNode(false);
	mxUtils.write(stylePanel4, mxResources.get('position'));
	stylePanel4.setAttribute('title', mxResources.get('position'));

	// Adds label position options
	var positionSelect = document.createElement('select');
	positionSelect.setAttribute('title', mxResources.get('position'));
	positionSelect.style.left = '114px';
	positionSelect.style.width = '98px';
	
	var directions = ['topLeft', 'top', 'topRight', 'left', 'center', 'right', 'bottomLeft', 'bottom', 'bottomRight'];
	var lset = {'topLeft': [mxConstants.ALIGN_LEFT, mxConstants.ALIGN_TOP, mxConstants.ALIGN_RIGHT, mxConstants.ALIGN_BOTTOM],
		'top': [mxConstants.ALIGN_CENTER, mxConstants.ALIGN_TOP, mxConstants.ALIGN_CENTER, mxConstants.ALIGN_BOTTOM],
		'topRight': [mxConstants.ALIGN_RIGHT, mxConstants.ALIGN_TOP, mxConstants.ALIGN_LEFT, mxConstants.ALIGN_BOTTOM],
		'left': [mxConstants.ALIGN_LEFT, mxConstants.ALIGN_MIDDLE, mxConstants.ALIGN_RIGHT, mxConstants.ALIGN_MIDDLE],
		'center': [mxConstants.ALIGN_CENTER, mxConstants.ALIGN_MIDDLE, mxConstants.ALIGN_CENTER, mxConstants.ALIGN_MIDDLE],
		'right': [mxConstants.ALIGN_RIGHT, mxConstants.ALIGN_MIDDLE, mxConstants.ALIGN_LEFT, mxConstants.ALIGN_MIDDLE],
		'bottomLeft': [mxConstants.ALIGN_LEFT, mxConstants.ALIGN_BOTTOM, mxConstants.ALIGN_RIGHT, mxConstants.ALIGN_TOP],
		'bottom': [mxConstants.ALIGN_CENTER, mxConstants.ALIGN_BOTTOM, mxConstants.ALIGN_CENTER, mxConstants.ALIGN_TOP],
		'bottomRight': [mxConstants.ALIGN_RIGHT, mxConstants.ALIGN_BOTTOM, mxConstants.ALIGN_LEFT, mxConstants.ALIGN_TOP]};

	for (var i = 0; i < directions.length; i++)
	{
		var positionOption = document.createElement('option');
		positionOption.setAttribute('value', directions[i]);
		mxUtils.write(positionOption, mxResources.get(directions[i]));
		positionSelect.appendChild(positionOption);
	}

	stylePanel4.appendChild(positionSelect);
	
	// Writing direction
	var stylePanel5 = stylePanel4.cloneNode(false);
	mxUtils.write(stylePanel5, mxResources.get('writingDirection'));
	stylePanel5.setAttribute('title', mxResources.get('writingDirection'));

	// Adds writing direction options
	// LATER: Handle reselect of same option in all selects (change event
	// is not fired for same option so have opened state on click) and
	// handle multiple different styles for current selection
	var dirSelect = positionSelect.cloneNode(false);
	dirSelect.setAttribute('title', mxResources.get('writingDirection'));

	// NOTE: For automatic we use the value null since automatic
	// requires the text to be non formatted and non-wrapped
	var dirs = ['automatic', 'leftToRight', 'rightToLeft'];

	if (ss.html)
	{
		dirs.push('vertical-leftToRight');
		dirs.push('vertical-rightToLeft');
	}

	var dirSet = {'automatic': null,
		'leftToRight': mxConstants.TEXT_DIRECTION_LTR,
		'rightToLeft': mxConstants.TEXT_DIRECTION_RTL,
		'vertical-leftToRight': mxConstants.TEXT_DIRECTION_VERTICAL_LR,
		'vertical-rightToLeft': mxConstants.TEXT_DIRECTION_VERTICAL_RL};

	for (var i = 0; i < dirs.length; i++)
	{
		var dirOption = document.createElement('option');
		dirOption.setAttribute('value', dirs[i]);

		if (dirs[i].substring(0, 9) == 'vertical-')
		{
			mxUtils.write(dirOption, mxResources.get('vertical') +
				' (' + mxResources.get(dirs[i].substring(9)) + ')');
		}
		else
		{
			mxUtils.write(dirOption, mxResources.get(dirs[i]));
		}

		dirSelect.appendChild(dirOption);
	}

	stylePanel5.appendChild(dirSelect);
	
	if (!graph.isEditing())
	{
		container.appendChild(stylePanel4);
		
		mxEvent.addListener(positionSelect, 'change', function(evt)
		{
			graph.getModel().beginUpdate();
			try
			{
				var vals = lset[positionSelect.value];
				
				if (vals != null)
				{
					graph.setCellStyles(mxConstants.STYLE_LABEL_POSITION, vals[0], ss.cells);
					graph.setCellStyles(mxConstants.STYLE_VERTICAL_LABEL_POSITION, vals[1], ss.cells);
					graph.setCellStyles(mxConstants.STYLE_ALIGN, vals[2], ss.cells);
					graph.setCellStyles(mxConstants.STYLE_VERTICAL_ALIGN, vals[3], ss.cells);
				}
			}
			finally
			{
				graph.getModel().endUpdate();
			}
			
			mxEvent.consume(evt);
		});

		// LATER: Update dir in text editor while editing and update style with label
		// NOTE: The tricky part is handling and passing on the auto value
		container.appendChild(stylePanel5);
		
		mxEvent.addListener(dirSelect, 'change', function(evt)
		{
			graph.setCellStyles(mxConstants.STYLE_TEXT_DIRECTION, dirSet[dirSelect.value], ss.cells);
			mxEvent.consume(evt);
		});
	}

	// Fontsize
	var input = document.createElement('input');
	input.style.position = 'absolute';
	input.style.left = '146px';
	input.style.width = '52px';
	input.setAttribute('title', mxResources.get('fontSize'));
	stylePanel2.appendChild(input);
	
	var inputUpdate = this.installInputHandler(input, mxConstants.STYLE_FONTSIZE,
		Menus.prototype.defaultFontSize, 1, 999, ' ' + Editor.fontSizeUnit, function(fontSize)
	{
		var node = graph.getSelectedEditingElement();

		if (node != null)
		{
			input.value = fontSize + ' ' + Editor.fontSizeUnit;
			document.execCommand('fontSize', false, '1');

			// Finds the new or updated element and sets the actual font size
			var fonts = graph.cellEditor.textarea.getElementsByTagName('font');

			for (var i = 0; i < fonts.length; i++)
			{
				if (fonts[i].getAttribute('size') == '1')
				{
					fonts[i].removeAttribute('size');
					fonts[i].style.fontSize = '';
					var css = mxUtils.getCurrentStyle(fonts[i]);
					
					if (fontSize != getAbsoluteFontSize(css))
					{
						fonts[i].style.fontSize = fontSize + 'px';
					}
					else if (fonts[i].getAttribute('style') == '')
					{
						fonts[i].removeAttribute('style');
					}
				}
			}
		}
	}, true);
	
	var stepper = this.createStepper(input, inputUpdate, 1, true, Menus.prototype.defaultFontSize);
	stepper.style.display = input.style.display;
	stepper.style.left = '198px';

	if (ss.style[mxConstants.STYLE_FONTSIZE] == 'inherit')
	{
		input.style.display = 'none';
		stepper.style.display = 'none';
	}
	
	stylePanel2.appendChild(stepper);
	var bgColorApply = null;
	var currentBgColor = graph.shapeBackgroundColor;
	
	var fontColorApply = null;
	var currentFontColor = graph.shapeForegroundColor;

	// Used for RBG and HEX default background color matching
	var temp = mxUtils.getLightDarkColor(graph.shapeBackgroundColor);
	var rgbBgColor = 'light-dark(' +
		mxUtils.hex2rgb(temp.light) + ', ' +
		mxUtils.hex2rgb(temp.dark) + ')';

	var bgPanel = (graph.cellEditor.isContentEditing()) ?
		// Font background color option for selection text
		this.createColorOption(mxResources.get('backgroundColor'), function()
		{
			return (currentBgColor == graph.shapeBackgroundColor ||
				currentBgColor == rgbBgColor) ? 'default' : currentBgColor;
		}, function(color)
		{
			if (graph.cellEditor.textarea != null)
			{
				if (color == 'default')
				{
					color = graph.shapeBackgroundColor;
				}
				
				Graph.setTextColor(graph.cellEditor.textarea, color, false);
				ui.fireEvent(new mxEventObject('styleChanged',
					'keys', [mxConstants.STYLE_LABEL_BACKGROUNDCOLOR],
					'values', [color], 'cells', ss.cells));
			}
		}, 'default',
		{
			install: function(apply) { bgColorApply = apply; },
			destroy: function() { bgColorApply = null; }
		}, null, null, graph.shapeBackgroundColor) :
		// Font background color option for shape
		this.createCellColorOption(mxResources.get('backgroundColor'),
			mxConstants.STYLE_LABEL_BACKGROUNDCOLOR, 'default', null, function(color)
		{
			graph.updateLabelElements(ss.cells, function(elt)
			{
				elt.style.backgroundColor = null;
			});
		}, graph.shapeBackgroundColor);
	
	bgPanel.style.fontWeight = 'bold';

	var borderPanel = this.createCellColorOption(mxResources.get('borderColor'),
		mxConstants.STYLE_LABEL_BORDERCOLOR, 'default', null, null,
		graph.shapeForegroundColor);
	borderPanel.style.fontWeight = 'bold';
	
	// Gets default colors for selection
	var defs = (ss.vertices.length >= 1) ?
		graph.stylesheet.getDefaultVertexStyle() :
		graph.stylesheet.getDefaultEdgeStyle();

	var panel = (graph.cellEditor.isContentEditing()) ?
		// Font color option for selection text
		this.createColorOption(mxResources.get('fontColor'), function()
		{
			return currentFontColor;
		}, function(color)
		{
			if (graph.cellEditor.textarea != null)
			{
				if (color == 'default')
				{
					color = mxConstants.NONE;
				}

				Graph.setTextColor(graph.cellEditor.textarea, color, true);
				ui.fireEvent(new mxEventObject('styleChanged',
					'keys', [mxConstants.STYLE_FONTCOLOR],
					'values', [color], 'cells', ss.cells));
			}
		}, 'default',
		{
			install: function(apply) { fontColorApply = apply; },
			destroy: function() { fontColorApply = null; }
		}, null, true, (defs[mxConstants.STYLE_FONTCOLOR] != null &&
			defs[mxConstants.STYLE_FONTCOLOR] != 'default') ?
			defs[mxConstants.STYLE_FONTCOLOR] : graph.shapeForegroundColor) :
		// Font color option for shape
		this.createCellColorOption(mxResources.get('fontColor'),
			mxConstants.STYLE_FONTCOLOR, 'default', function(color)
		{
			if (color == mxConstants.NONE)
			{
				bgPanel.style.display = 'none';
			}
			else
			{
				bgPanel.style.display = '';
			}
			
			borderPanel.style.display = bgPanel.style.display;
		}, function(color)
		{
			if (color == mxConstants.NONE)
			{
				graph.setCellStyles(mxConstants.STYLE_NOLABEL, '1', ss.cells);
			}
			else
			{
				graph.setCellStyles(mxConstants.STYLE_NOLABEL, null, ss.cells);
			}
			
			graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, color, ss.cells);

			graph.updateLabelElements(ss.cells, function(elt)
			{
				elt.removeAttribute('color');
				elt.style.color = null;
			});
		}, graph.shapeForegroundColor);

	if (ss.style[mxConstants.STYLE_FONTCOLOR] == 'inherit')
	{
		panel.style.display = 'none';
	}
	
	panel.style.fontWeight = 'bold';
	colorPanel.appendChild(panel);
	colorPanel.appendChild(bgPanel);
	
	var textShadow = this.createCellOption(mxResources.get('shadow'),
		mxConstants.STYLE_TEXT_SHADOW, 0);
	textShadow.style.width = '100%';
	textShadow.style.fontWeight = 'bold';

	if (!Editor.enableShadowOption)
	{
		textShadow.getElementsByTagName('input')[0].setAttribute('disabled', 'disabled');
		mxUtils.setOpacity(textShadow, 60);
	}
	
	if (!graph.cellEditor.isContentEditing())
	{
		colorPanel.appendChild(borderPanel);
		colorPanel.appendChild(textShadow);
	}

	container.appendChild(colorPanel);

	var extraPanel = this.createPanel();
	extraPanel.style.paddingTop = '2px';
	extraPanel.style.paddingBottom = '4px';
	
	var wwCells = graph.filterSelectionCells(mxUtils.bind(this, function(cell)
	{
		var state = graph.view.getState(cell);

		return state == null ||
			graph.getModel().isEdge(cell) ||
			graph.isAutoSizeState(state);
	}));

	var state = graph.view.getState(graph.getSelectionCell());
	var formatted = mxUtils.getValue(ss.style, 'html', 0) == '1';

	// Uses svgWhiteSpace when convertToSvg is active, whiteSpace otherwise
	var isSvgMode = formatted && ((graph.getSelectionCount() > 1 && ss.style['convertToSvg'] == '1') ||
		(graph.getSelectionCount() == 1 && state != null && state.text != null &&
		state.text.node != null && state.text.node.getElementsByTagName('foreignObject').length == 0));

	var wwStyleKey = isSvgMode ? 'svgWhiteSpace' : mxConstants.STYLE_WHITE_SPACE;
	var wwOpt = this.createCellOption(mxResources.get('wordWrap'), wwStyleKey,
		null, 'wrap', 'null', null, null, true, wwCells);
	wwOpt.style.fontWeight = 'bold';

	// Word wrap in edge labels only supported via labelWidth style
	if (wwCells.length > 0)
	{
		extraPanel.appendChild(wwOpt);
	}

	// Delegates switch of style to formattedText action as it also convertes newlines
	var htmlOpt = this.createCellOption(mxResources.get('formattedText'), 'html', 0,
		null, null, null, ui.actions.get('formattedText'));
	htmlOpt.style.fontWeight = 'bold';
	extraPanel.appendChild(htmlOpt);

	var convertToSvg = this.createCellOption(mxResources.get('lblToSvg'), 'convertToSvg', '0',
		null, null, function(cells, value)
	{
		// Syncs word wrap style when toggling convertToSvg
		for (var i = 0; i < cells.length; i++)
		{
			var cellStyle = graph.getCurrentCellStyle(cells[i]);

			if (value)
			{
				// Toggled ON: copy whiteSpace to svgWhiteSpace
				if (cellStyle[mxConstants.STYLE_WHITE_SPACE] == 'wrap')
				{
					graph.setCellStyles('svgWhiteSpace', 'wrap', [cells[i]]);
				}
			}
			else
			{
				// Toggled OFF: copy svgWhiteSpace to whiteSpace
				if (cellStyle['svgWhiteSpace'] == 'wrap')
				{
					graph.setCellStyles(mxConstants.STYLE_WHITE_SPACE, 'wrap', [cells[i]]);
				}
			}
		}
	});
	convertToSvg.style.fontWeight = 'bold';
	extraPanel.appendChild(convertToSvg);
	
	if (!formatted)
	{
		convertToSvg.style.opacity = '0.5';
		convertToSvg.getElementsByTagName('input')[0].setAttribute('disabled', 'disabled');
	}
	else
	{
		// Disables option if any selected cell's label contains HTML elements
		// that are not supported by the HTML-to-SVG conversion in mxSvgCanvas2D
		var supportedTags = {'H1': 1, 'H2': 1, 'H3': 1, 'H4': 1, 'H5': 1, 'H6': 1,
			'P': 1, 'PRE': 1, 'BLOCKQUOTE': 1, 'DIV': 1, 'SUP': 1, 'SUB': 1,
			'B': 1, 'I': 1, 'SPAN': 1, 'FONT': 1, 'STRIKE': 1, 'U': 1, 'BR': 1};
		var hasUnsupported = false;
		var cells = graph.getSelectionCells();

		for (var i = 0; i < cells.length && !hasUnsupported; i++)
		{
			var label = graph.getLabel(cells[i]);

			if (label != null && label.length > 0)
			{
				var tmp = document.createElement('div');
				tmp.innerHTML = label;
				var elts = tmp.getElementsByTagName('*');

				for (var j = 0; j < elts.length; j++)
				{
					if (supportedTags[elts[j].nodeName] == null ||
						(elts[j].style != null && elts[j].style.backgroundColor != ''))
					{
						hasUnsupported = true;
						break;
					}
				}
			}
		}

		if (hasUnsupported)
		{
			convertToSvg.style.opacity = '0.5';
			convertToSvg.getElementsByTagName('input')[0].setAttribute('disabled', 'disabled');
			convertToSvg.setAttribute('title',
				'Label contains unsupported HTML for SVG conversion. ' +
				'Supported: H1-H6, P, PRE, BLOCKQUOTE, DIV, B, I, U, STRIKE, ' +
				'SUP, SUB, SPAN, FONT, BR (without background color).');
		}
	}

	var autosizeOpt = this.createCellOption(mxResources.get('autosizeText'),
		'autosizeText', '0', null, null, mxUtils.bind(this, function(cells, value)
	{
		if (value)
		{
			for (var i = 0; i < cells.length; i++)
			{
				if (graph.model.isVertex(cells[i]))
				{
					graph.updateAutosizeTextFontSize(cells[i]);
				}
			}
		}
	}));
	autosizeOpt.style.fontWeight = 'bold';
	
	// Word wrap in edge labels only supported via labelWidth style
	if (ss.vertices.length > 0)
	{
		extraPanel.appendChild(autosizeOpt);
	}

	if (!ui.isOffline() || mxClient.IS_CHROMEAPP || EditorUi.isElectronApp)
	{
		convertToSvg.getElementsByTagName('span')[0].style.maxWidth = '172px';
		convertToSvg.appendChild(ui.menus.createHelpLink(
			'https://github.com/jgraph/drawio/discussions/5165'));
	}

	var spacingPanel = this.createPanel();
	spacingPanel.style.height = '86px';

	var topUpdate, globalUpdate, leftUpdate, bottomUpdate, rightUpdate;
	var topSpacing = this.addUnitInput(spacingPanel, this.getUnit(), 87, 52, function()
	{
		topUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	topSpacing.setAttribute('title', mxResources.get('top'));
	var globalSpacing = this.addUnitInput(spacingPanel, this.getUnit(), 16, 52, function()
	{
		globalUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	globalSpacing.setAttribute('title', mxResources.get('global'));

	mxUtils.br(spacingPanel);
	this.addLabel(spacingPanel, mxResources.get('top'), 87, 64);
	this.addLabel(spacingPanel, mxResources.get('global'), 16, 64);
	mxUtils.br(spacingPanel);
	mxUtils.br(spacingPanel);

	var leftSpacing = this.addUnitInput(spacingPanel, this.getUnit(), 158, 52, function()
	{
		leftUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	leftSpacing.setAttribute('title', mxResources.get('left'));
	var bottomSpacing = this.addUnitInput(spacingPanel, this.getUnit(), 87, 52, function()
	{
		bottomUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	bottomSpacing.setAttribute('title', mxResources.get('bottom'));
	var rightSpacing = this.addUnitInput(spacingPanel, this.getUnit(), 16, 52, function()
	{
		rightUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	rightSpacing.setAttribute('title', mxResources.get('right'));

	mxUtils.br(spacingPanel);
	this.addLabel(spacingPanel, mxResources.get('left'), 158, 64);
	this.addLabel(spacingPanel, mxResources.get('bottom'), 87, 64);
	this.addLabel(spacingPanel, mxResources.get('right'), 16, 64);
	
	if (!graph.cellEditor.isContentEditing())
	{
		container.appendChild(extraPanel);
		container.appendChild(this.createRelativeOption(mxResources.get('opacity'), mxConstants.STYLE_TEXT_OPACITY));
		var spacingSec = this.createCollapsibleSection(mxResources.get('spacing'), true);
		spacingSec.contentDiv.appendChild(spacingPanel);
		container.appendChild(spacingSec.wrapper);
	}
	else
	{
		var selState = null;
		var lineHeightInput = null;
		
		container.appendChild(this.createRelativeOption(mxResources.get('lineheight'), null, null, function(input)
		{
			var value = (input.value == '') ? 120 : parseInt(input.value);
			value = Math.max(0, (isNaN(value)) ? 120 : value);

			if (window.getSelection)
			{
				if (selState != null)
				{
					graph.cellEditor.restoreSelection(selState);
					selState = null;
				}

				// Updates line height of selected element and all selected child elements
				var node = graph.getSelectedEditingElement();

				// Wraps all text in a div to set line height
				if (graph.cellEditor.textarea != null && node == graph.cellEditor.textarea)
				{
					var sel = window.getSelection();
					
					if (sel.getRangeAt && sel.rangeCount > 0)
					{
						// Wraps the selection in a new div
						var range = sel.getRangeAt(0);
						node = document.createElement('div');
						node.appendChild(range.extractContents());
						graph.cellEditor.textarea.innerHTML = '';
						graph.cellEditor.textarea.appendChild(node);
						sel.removeAllRanges();

						// Selects the new div
						var range = new Range();
						range.selectNodeContents(node);
						sel.addRange(range);
					}
				}

				if (node != null)
				{
					if (node != graph.cellEditor.textarea)
					{
						setLineHeight(node, value);
					}

					// Sets line height on all selected elements
					// as the resulting line height depends on
					// the font size of the element
					var elts = node.getElementsByTagName('*');
					var selection = window.getSelection();

					for (var i = 0; i < elts.length; i++)
					{
						if (selection.containsNode(elts[i], true))
						{
							setLineHeight(elts[i], value);
						}
					}
				}
			}

			input.value = value + ' %';
		}, function(input)
		{
			// Used in CSS handler to update current value
			lineHeightInput = input;

			mxEvent.addGestureListeners(input, mxUtils.bind(this, function(evt)
			{
				if (document.activeElement == graph.cellEditor.textarea)
				{
					selState = graph.cellEditor.saveSelection();
				}
			}));
			
			mxEvent.addListener(input, 'touchstart', function()
			{
				if (document.activeElement == graph.cellEditor.textarea)
				{
					selState = graph.cellEditor.saveSelection();
				}
			});
			
			// Default value for lineHeight is 1.2
			input.value = '120 %';
		}));
		
		var insertPanel = stylePanel.cloneNode(false);
		ui.toolbar.addItems(['link', 'image'], insertPanel, true, [Editor.linkImage, Editor.imageImage]);

		var btns = [
			ui.addButton(Editor.horizontalRuleImage, mxResources.get('insertHorizontalRule'),
			function()
			{
				document.execCommand('inserthorizontalrule', false);
			}, insertPanel),
			ui.toolbar.addMenu(new Menu(mxUtils.bind(this, function(menu)
			{
				ui.menus.addInsertTableItem(menu, null, null, false);
			})), null, Editor.tableImage, insertPanel)];
		
		var wrapper2 = this.createPanel();
		wrapper2.appendChild(this.createTitle(mxResources.get('insert')));
		wrapper2.appendChild(insertPanel);
		container.appendChild(wrapper2);
		
		var tablePanel = stylePanel.cloneNode(false);
		
		var btns = [
			ui.addButton(Editor.addColumnLeftImage, mxResources.get('insertColumnBefore'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (currentTable != null)
					{
						graph.insertColumn(currentTable, (tableCell != null) ? tableCell.cellIndex : 0);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), tablePanel),
			ui.addButton(Editor.addColumnRightImage, mxResources.get('insertColumnAfter'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (currentTable != null)
					{
						graph.insertColumn(currentTable, (tableCell != null) ? tableCell.cellIndex + 1 : -1);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), tablePanel),
			ui.addButton(Editor.removeColumnImage, mxResources.get('deleteColumn'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (currentTable != null && tableCell != null)
					{
						graph.deleteColumn(currentTable, tableCell.cellIndex);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), tablePanel),
			ui.addButton(Editor.addRowAboveImage, mxResources.get('insertRowBefore'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (currentTable != null && tableRow != null)
					{
						graph.insertRow(currentTable, tableRow.sectionRowIndex);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), tablePanel),
			ui.addButton(Editor.addRowBelowImage, mxResources.get('insertRowAfter'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (currentTable != null && tableRow != null)
					{
						graph.insertRow(currentTable, tableRow.sectionRowIndex + 1);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), tablePanel),
			ui.addButton(Editor.removeRowImage, mxResources.get('deleteRow'),
			mxUtils.bind(this, function()
			{
				try
				{
					if (currentTable != null && tableRow != null)
					{
						graph.deleteRow(currentTable, tableRow.sectionRowIndex);
					}
				}
				catch (e)
				{
					ui.handleError(e);
				}
			}), tablePanel)];
	btns[2].style.marginRight = '10px';
	
	var wrapper3 = this.createPanel();
	wrapper3.appendChild(this.createTitle(mxResources.get('table')));
	wrapper3.appendChild(tablePanel);

	var tablePanel2 = stylePanel.cloneNode(false);
	
	var btns = [
		ui.addButton(Editor.strokeColorImage, mxResources.get('borderColor'),
		mxUtils.bind(this, function(evt)
		{
			if (currentTable != null)
			{
				// Converts rgb(r,g,b) values
				var color = currentTable.style.borderColor.replace(
						/\brgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
						function($0, $1, $2, $3) {
							return "#" + ("0"+Number($1).toString(16)).substr(-2) + ("0"+Number($2).toString(16)).substr(-2) + ("0"+Number($3).toString(16)).substr(-2);
						});
				ui.pickColor(color, function(newColor)
				{
					var targetElt = (tableCell != null && (evt == null || !mxEvent.isShiftDown(evt))) ? tableCell : currentTable;
					
					graph.processElements(targetElt, function(elt)
					{
						elt.style.border = null;
					});
					
					if (newColor == null || newColor == mxConstants.NONE)
					{
						targetElt.removeAttribute('border');
						targetElt.style.border = '';
						targetElt.style.borderCollapse = '';
					}
					else
					{
						targetElt.setAttribute('border', '1');
						targetElt.style.border = '1px solid ' + newColor;
						targetElt.style.borderCollapse = 'collapse';
					}
				});
			}
		}), tablePanel2),
		ui.addButton(Editor.fillColorImage, mxResources.get('backgroundColor'),
		mxUtils.bind(this, function(evt)
		{
			// Converts rgb(r,g,b) values
			if (currentTable != null)
			{
				var color = currentTable.style.backgroundColor.replace(
						/\brgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
						function($0, $1, $2, $3) {
							return "#" + ("0"+Number($1).toString(16)).substr(-2) + ("0"+Number($2).toString(16)).substr(-2) + ("0"+Number($3).toString(16)).substr(-2);
						});
				ui.pickColor(color, function(newColor)
				{
					var targetElt = (tableCell != null && (evt == null || !mxEvent.isShiftDown(evt))) ? tableCell : currentTable;
					
					graph.processElements(targetElt, function(elt)
					{
						elt.style.backgroundColor = null;
					});
					
					if (newColor == null || newColor == mxConstants.NONE)
					{
						targetElt.style.backgroundColor = '';
					}
					else
					{
						targetElt.style.backgroundColor = newColor;
					}
				});
			}
		}), tablePanel2),
		ui.addButton(Editor.spacingImage, mxResources.get('spacing'),
		function()
		{
			if (currentTable != null)
			{
				var value = currentTable.getAttribute('cellPadding') || 0;
				
				var dlg = new FilenameDialog(ui, value, mxResources.get('apply'),
					mxUtils.bind(this, function(newValue)
				{
					if (newValue != null && newValue.length > 0)
					{
						currentTable.setAttribute('cellPadding', newValue);
					}
					else
					{
						currentTable.removeAttribute('cellPadding');
					}
				}), mxResources.get('spacing'));
				ui.showDialog(dlg.container, 300, 80, true, true);
				dlg.init();
			}
		}, tablePanel2),
		ui.addButton(Editor.alignLeftImage, mxResources.get('left'),
		function()
		{
			if (currentTable != null)
			{
				currentTable.setAttribute('align', 'left');
			}
		}, tablePanel2),
		ui.addButton(Editor.alignCenterImage, mxResources.get('center'),
		function()
		{
			if (currentTable != null)
			{
				currentTable.setAttribute('align', 'center');
			}
		}, tablePanel2),
		ui.addButton(Editor.alignRightImage, mxResources.get('right'),
		function()
		{
			if (currentTable != null)
			{
				currentTable.setAttribute('align', 'right');
			}
		}, tablePanel2)];
		btns[2].style.marginRight = '10px';
		
		wrapper3.appendChild(tablePanel2);
		container.appendChild(wrapper3);
		
		tableWrapper = wrapper3;
	}
	
	function setSelected(elt, selected)
	{
		if (selected)
		{
			elt.classList.add('geActiveItem');
		}
		else
		{
			elt.classList.remove('geActiveItem');
		}
	};

	// Updates font style state before typing
	for (var i = 0; i < 3; i++)
	{
		(function(index)
		{
			mxEvent.addListener(fontStyleItems[index], 'click', function()
			{
				setSelected(fontStyleItems[index], fontStyleItems[index].style.backgroundImage == '');
			});
		})(i);
	}

	var listener = mxUtils.bind(this, function(sender, evt, force)
	{
		ss = ui.getSelectionState();
		var fontStyle = mxUtils.getValue(ss.style, mxConstants.STYLE_FONTSTYLE, 0);
		setSelected(fontStyleItems[0], (fontStyle & mxConstants.FONT_BOLD) == mxConstants.FONT_BOLD);
		setSelected(fontStyleItems[1], (fontStyle & mxConstants.FONT_ITALIC) == mxConstants.FONT_ITALIC);
		setSelected(fontStyleItems[2], (fontStyle & mxConstants.FONT_UNDERLINE) == mxConstants.FONT_UNDERLINE);
		ui.toolbar.setMenuText(fontMenu, mxUtils.getValue(ss.style, mxConstants.STYLE_FONTFAMILY,
			Menus.prototype.defaultFont));

		setSelected(verticalItem, mxUtils.getValue(ss.style, mxConstants.STYLE_HORIZONTAL, '1') == '0');
		
		if (force || document.activeElement != input)
		{
			var tmp = parseFloat(mxUtils.getValue(ss.style, mxConstants.STYLE_FONTSIZE, Menus.prototype.defaultFontSize));
			input.value = (isNaN(tmp)) ? '' : tmp + ' ' + Editor.fontSizeUnit;
		}
		
		var align = mxUtils.getValue(ss.style, mxConstants.STYLE_ALIGN, mxConstants.ALIGN_CENTER);
		setSelected(left, align == mxConstants.ALIGN_LEFT);
		setSelected(center, align == mxConstants.ALIGN_CENTER);
		setSelected(right, align == mxConstants.ALIGN_RIGHT);
		
		var valign = mxUtils.getValue(ss.style, mxConstants.STYLE_VERTICAL_ALIGN, mxConstants.ALIGN_MIDDLE);
		setSelected(top, valign == mxConstants.ALIGN_TOP);
		setSelected(middle, valign == mxConstants.ALIGN_MIDDLE);
		setSelected(bottom, valign == mxConstants.ALIGN_BOTTOM);
		
		var pos = mxUtils.getValue(ss.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER);
		var vpos = mxUtils.getValue(ss.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE);
		
		if (pos == mxConstants.ALIGN_LEFT && vpos == mxConstants.ALIGN_TOP)
		{
			positionSelect.value = 'topLeft';
		}
		else if (pos == mxConstants.ALIGN_CENTER && vpos == mxConstants.ALIGN_TOP)
		{
			positionSelect.value = 'top';
		}
		else if (pos == mxConstants.ALIGN_RIGHT && vpos == mxConstants.ALIGN_TOP)
		{
			positionSelect.value = 'topRight';
		}
		else if (pos == mxConstants.ALIGN_LEFT && vpos == mxConstants.ALIGN_BOTTOM)
		{
			positionSelect.value = 'bottomLeft';
		}
		else if (pos == mxConstants.ALIGN_CENTER && vpos == mxConstants.ALIGN_BOTTOM)
		{
			positionSelect.value = 'bottom';
		}
		else if (pos == mxConstants.ALIGN_RIGHT && vpos == mxConstants.ALIGN_BOTTOM)
		{
			positionSelect.value = 'bottomRight';
		}
		else if (pos == mxConstants.ALIGN_LEFT)
		{
			positionSelect.value = 'left';
		}
		else if (pos == mxConstants.ALIGN_RIGHT)
		{
			positionSelect.value = 'right';
		}
		else
		{
			positionSelect.value = 'center';
		}
		
		var dir = mxUtils.getValue(ss.style, mxConstants.STYLE_TEXT_DIRECTION, mxConstants.DEFAULT_TEXT_DIRECTION);
		
		if (dir == mxConstants.TEXT_DIRECTION_RTL)
		{
			dirSelect.value = 'rightToLeft';
		}
		else if (dir == mxConstants.TEXT_DIRECTION_LTR)
		{
			dirSelect.value = 'leftToRight';
		}
		else if (dir == mxConstants.TEXT_DIRECTION_AUTO || !ss.html)
		{
			dirSelect.value = 'automatic';
		}
		else if (dir == mxConstants.TEXT_DIRECTION_VERTICAL_LR)
		{
			dirSelect.value = 'vertical-leftToRight';
		}
		else if (dir == mxConstants.TEXT_DIRECTION_VERTICAL_RL)
		{
			dirSelect.value = 'vertical-rightToLeft';
		}
		
		if (force || document.activeElement != globalSpacing)
		{
			var tmp = parseFloat(mxUtils.getValue(ss.style, mxConstants.STYLE_SPACING, 2));
			globalSpacing.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}

		if (force || document.activeElement != topSpacing)
		{
			var tmp = parseFloat(mxUtils.getValue(ss.style, mxConstants.STYLE_SPACING_TOP, 0));
			topSpacing.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}
		
		if (force || document.activeElement != rightSpacing)
		{
			var tmp = parseFloat(mxUtils.getValue(ss.style, mxConstants.STYLE_SPACING_RIGHT, 0));
			rightSpacing.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}
		
		if (force || document.activeElement != bottomSpacing)
		{
			var tmp = parseFloat(mxUtils.getValue(ss.style, mxConstants.STYLE_SPACING_BOTTOM, 0));
			bottomSpacing.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}
		
		if (force || document.activeElement != leftSpacing)
		{
			var tmp = parseFloat(mxUtils.getValue(ss.style, mxConstants.STYLE_SPACING_LEFT, 0));
			leftSpacing.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}
	});

	globalUpdate = this.installInputHandler(globalSpacing, mxConstants.STYLE_SPACING, 2, -999, 999, 
			this.getUnit(' '), null, this.isFloatUnit(), true);
	topUpdate = this.installInputHandler(topSpacing, mxConstants.STYLE_SPACING_TOP, 0, -999, 999, 
			this.getUnit(' '), null, this.isFloatUnit(), true);
	rightUpdate = this.installInputHandler(rightSpacing, mxConstants.STYLE_SPACING_RIGHT, 0, -999, 999, 
			this.getUnit(' '), null, this.isFloatUnit(), true);
	bottomUpdate = this.installInputHandler(bottomSpacing, mxConstants.STYLE_SPACING_BOTTOM, 0, -999, 999, 
			this.getUnit(' '), null, this.isFloatUnit(), true);
	leftUpdate = this.installInputHandler(leftSpacing, mxConstants.STYLE_SPACING_LEFT, 0, -999, 999, 
			this.getUnit(' '), null, this.isFloatUnit(), true);

	this.addKeyHandler(input, listener);
	this.addKeyHandler(globalSpacing, listener);
	this.addKeyHandler(topSpacing, listener);
	this.addKeyHandler(rightSpacing, listener);
	this.addKeyHandler(bottomSpacing, listener);
	this.addKeyHandler(leftSpacing, listener);

	graph.getModel().addListener(mxEvent.CHANGE, listener);
	this.listeners.push({destroy: function() { graph.getModel().removeListener(listener); }});
	listener();
	
	if (graph.cellEditor.isContentEditing())
	{
		var propertiesPanel = null;
		var updating = false;
		
		var updateCssHandler = mxUtils.bind(this, function()
		{
			if (!updating)
			{
				updating = true;
			
				window.setTimeout(mxUtils.bind(this, function()
				{
					var node = graph.getSelectedEditingElement();

					if (node != null && graph.cellEditor.textarea != null)
					{
						var css = mxUtils.getCurrentStyle(node);
						var lineHeight = (node == graph.cellEditor.textarea ||
							node.style.lineHeight == '') ? null : node.style.lineHeight;
						var fontSize = (node == graph.cellEditor.textarea ||
							node.style.fontSize == '') ? null : getAbsoluteFontSize(css)

						// Finds first selected child element
						if (window.getSelection)
						{
							var elts = node.getElementsByTagName('*');
							var selection = window.getSelection();

							for (var i = 0; i < elts.length; i++)
							{
								if (selection.containsNode(elts[i], true) &&
									elts[i].style != null)
								{
									if (fontSize == null && elts[i].style.fontSize != '')
									{
										fontSize = parseFloat(elts[i].style.fontSize);
									}

									if (lineHeight == null && elts[i].style.lineHeight != '')
									{
										lineHeight = elts[i].style.lineHeight;
									}

									if (fontSize != null && lineHeight != null)
									{
										break;
									}
								}
							}
						}

						if (fontSize == null)
						{
							fontSize = getAbsoluteFontSize(css);
						}

						if (lineHeight == null)
						{
							var temp = node;

							while (temp != null && temp != graph.cellEditor.textarea.parentNode)
							{
								if (temp.style != null && temp.style.lineHeight != '')
								{
									lineHeight = temp.style.lineHeight;
									break;
								}

								temp = temp.parentNode;
							}
						}
						
						function getParentBlock(elt)
						{
							while (elt != null && elt != graph.cellEditor.textarea)
							{
								var css = mxUtils.getCurrentStyle(elt);

								if (css.display == 'block')
								{
									return elt;
								}

								elt = elt.parentNode;
							}

							return null;
						};
						
						function hasParentOrOnlyChild(name)
						{
							if (graph.getParentByName(node, name, graph.cellEditor.textarea) != null)
							{
								return true;
							}
							else
							{
								var child = node;
								
								while (child != null && child.childNodes.length == 1)
								{
									child = child.childNodes[0];
									
									if (child.nodeName == name)
									{
										return true;
									}
								}
							}
							
							return false;
						};
						
						function isEqualOrPrefixed(str, value)
						{
							if (str != null && value != null)
							{
								if (str == value)
								{
									return true;
								}
								else if (str.length > value.length + 1)
								{
									return str.substring(str.length - value.length - 1,
										str.length) == '-' + value;
								}
							}
							
							return false;
						};
						
						if (css != null)
						{
							setSelected(fontStyleItems[0], css.fontWeight == 'bold' ||
								css.fontWeight > 400 || hasParentOrOnlyChild('B') ||
								hasParentOrOnlyChild('STRONG'));
							setSelected(fontStyleItems[1], css.fontStyle == 'italic' ||
								hasParentOrOnlyChild('I') || hasParentOrOnlyChild('EM'));
							setSelected(fontStyleItems[2], css.textDecorationLine == 'underline' ||
								hasParentOrOnlyChild('U'));
							setSelected(strike, css.textDecorationLine == 'line-through' ||
								hasParentOrOnlyChild('STRIKE'));
							setSelected(sup, hasParentOrOnlyChild('SUP'));
							setSelected(sub, hasParentOrOnlyChild('SUB'));

							// Adds editing for block CSS styles
							var block = getParentBlock(node);
							
							if (block != null)
							{
								var blockCss = mxUtils.getCurrentStyle(block);

								function checkUnit(value, unit, input, defaultValue)
								{
									if (parseInt(value) == value)
									{
										value += unit;

										if (input != null)
										{
											input.value = value;
										}
									}

									return value;
								};

								var cssProps = [];
								
								function addLengthProperty(name, dispName)
								{
									cssProps.push({name: name, dispName: dispName, type: 'string',
										getValue: function()
										{
											return blockCss[name];
										}, valueChanged: function(newValue, input)
										{
											block.style[name] = checkUnit(newValue, 'px', input);
											
											if (newValue == '' && input != null)
											{
												input.value = blockCss[name];
											}
										}});
								};

								addLengthProperty('paddingTop', 'Padding Top');
								addLengthProperty('paddingRight', 'Padding Right');
								addLengthProperty('paddingLeft', 'Padding Left');
								addLengthProperty('paddingBottom', 'Padding Bottom');
								addLengthProperty('marginTop', 'Margin Top');
								addLengthProperty('marginRight', 'Margin Right');
								addLengthProperty('marginLeft', 'Margin Left');
								addLengthProperty('marginBottom', 'Margin Bottom');

								var newPropertiesPanel = this.createPanel();
								this.addProperties(newPropertiesPanel, cssProps, ss, true)

								if (propertiesPanel != null)
								{
									propertiesPanel.parentNode.replaceChild(newPropertiesPanel, propertiesPanel);
								}
								else
								{
									container.appendChild(newPropertiesPanel);
								}

								propertiesPanel = newPropertiesPanel;
							}
							
							if (!graph.cellEditor.isTableSelected())
							{
								var align = graph.cellEditor.align || mxUtils.getValue(ss.style, mxConstants.STYLE_ALIGN, mxConstants.ALIGN_CENTER);

								if (isEqualOrPrefixed(css.textAlign, 'justify'))
								{
									setSelected(full, isEqualOrPrefixed(css.textAlign, 'justify'));
									setSelected(left, false);
									setSelected(center, false);
									setSelected(right, false);
								}
								else
								{
									setSelected(full, false);
									setSelected(left, align == mxConstants.ALIGN_LEFT);
									setSelected(center, align == mxConstants.ALIGN_CENTER);
									setSelected(right, align == mxConstants.ALIGN_RIGHT);
								}
							}
							else
							{
								setSelected(full, isEqualOrPrefixed(css.textAlign, 'justify'));
								setSelected(left, isEqualOrPrefixed(css.textAlign, 'left'));
								setSelected(center, isEqualOrPrefixed(css.textAlign, 'center'));
								setSelected(right, isEqualOrPrefixed(css.textAlign, 'right'));
							}
							
							currentTable = graph.getParentByName(node, 'TABLE', graph.cellEditor.textarea);
							tableRow = (currentTable == null) ? null : graph.getParentByName(node, 'TR', currentTable);
							tableCell = (currentTable == null) ? null : graph.getParentByNames(node, ['TD', 'TH'], currentTable);
							tableWrapper.style.display = (currentTable != null) ? '' : 'none';
							
							if (document.activeElement != input)
							{
								input.value = (isNaN(fontSize)) ? '' : fontSize + ' ' + Editor.fontSizeUnit;

								if (typeof lineHeight === 'string' && lineHeight.indexOf('%') > 0)
								{
									lineHeightInput.value = lineHeight.replace('%', ' %');
								}
								else
								{
									var lh = parseFloat(lineHeight);
									
									if (!isNaN(lh))
									{
										lineHeightInput.value = Math.round(lh * 100) + ' %';
									}
									else
									{
										lineHeightInput.value = '120 %';
									}
								}
							}
							
							if (fontColorApply != null)
							{
								currentFontColor = graph.getTextColor(node, true);
								fontColorApply(currentFontColor, true);
							}
							
							if (bgColorApply != null)
							{
								currentBgColor = graph.getTextColor(node, false);
								bgColorApply(currentBgColor, true);
							}

							ui.toolbar.setMenuText(fontMenu,
								mxUtils.getCssFontFamily(css.fontFamily));
						}
					}
					
					updating = false;
				}), 0);
			}
		});
		
		mxEvent.addListener(graph.cellEditor.textarea, 'input', updateCssHandler);
		mxEvent.addListener(graph.cellEditor.textarea, 'touchend', updateCssHandler);
		mxEvent.addListener(graph.cellEditor.textarea, 'mouseup', updateCssHandler);
		mxEvent.addListener(graph.cellEditor.textarea, 'keyup', updateCssHandler);
		this.listeners.push({destroy: function()
		{
			// No need to remove listener since textarea is destroyed after edit
		}});
		updateCssHandler();
	}

	return container;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel = function(format, editorUi, container)
{
	BaseFormatPanel.call(this, format, editorUi, container);
	this.init();
};

mxUtils.extend(StyleFormatPanel, BaseFormatPanel);

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel.prototype.init = function()
{
	var ui = this.editorUi;
	var ss = ui.getSelectionState();
	
	if (!ss.containsLabel && ss.cells.length > 0)
	{
		if (ss.containsImage && ss.vertices.length == 1 && ss.style.shape == 'image' &&
			ss.style.image != null && String(ss.style.image).
				substring(0, 19) == 'data:image/svg+xml;')
		{
			this.container.appendChild(this.addSvgStyles(this.createPanel()));
		}

		if (ss.fill)
		{
			var fillSec = this.createCollapsibleSection(mxResources.get('fill'), false);
			fillSec.contentDiv.appendChild(this.addFill(this.createPanel()));
			this.container.appendChild(fillSec.wrapper);
		}

		var strokeSec = this.createCollapsibleSection(mxResources.get('line'), false);
		strokeSec.contentDiv.appendChild(this.addStroke(this.createPanel()));
		this.container.appendChild(strokeSec.wrapper);

		var lineJumpsPanel = this.addLineJumps(this.createPanel());
		var jumpsSec = this.createCollapsibleSection(mxResources.get('lineJumps'), true);
		jumpsSec.contentDiv.appendChild(lineJumpsPanel);
		this.container.appendChild(jumpsSec.wrapper);
		this.syncCollapsibleVisibility(jumpsSec.wrapper, lineJumpsPanel);

		var opacityPanel = this.createRelativeOption(mxResources.get('opacity'), mxConstants.STYLE_OPACITY);
		this.container.appendChild(opacityPanel);

		var effectsSec = this.createCollapsibleSection(mxResources.get('effects'), true);
		effectsSec.contentDiv.appendChild(this.addEffects(this.createPanel()));
		this.container.appendChild(effectsSec.wrapper);
	}

	var opsPanel = this.createPanel();

	if (ss.cells.length == 1)
	{
		this.addEditOps(opsPanel);

		if (opsPanel.firstChild != null)
		{
			mxUtils.br(opsPanel);
		}
	}

	if (ss.cells.length >= 1)
	{
		this.addStyleOps(opsPanel);
	}

	if (opsPanel.firstChild != null)
	{
		this.container.appendChild(opsPanel);
	}
};

/**
 * Use browser for parsing CSS.
 */
StyleFormatPanel.prototype.getCssRules = function(css)
{
	var doc = document.implementation.createHTMLDocument('');
	var styleElement = document.createElement('style');
	
	mxUtils.setTextContent(styleElement, css);
	doc.body.appendChild(styleElement);

	return styleElement.sheet.cssRules;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel.prototype.addSvgStyles = function(container)
{
	var ui = this.editorUi;
	var ss = ui.getSelectionState();
	container.style.paddingTop = '6px';
	container.style.paddingBottom = '6px';
	container.style.fontWeight = 'bold';
	container.style.display = 'none';

	try
	{
		var exp = ss.style.editableCssRules;
		
		if (exp != null)
		{
			var regex = new RegExp(exp);
			
			var data = ss.style.image.substring(ss.style.image.indexOf(',') + 1);
			var xml = (window.atob) ? decodeURIComponent(escape(atob((data)))) :
				Base64.decode(data, true);
			var svg = mxUtils.parseXml(xml);

			if (svg != null)
			{
				var singleColorMode = svg.documentElement.style.colorScheme == 'light' ||
					mxUtils.getValue(ss.style, 'darkMode', null) == '0';
				var setColorScheme = svg.documentElement.style.colorScheme == '';
				var styles = svg.getElementsByTagName('style');

				for (var i = 0; i < styles.length; i++)
				{
					var rules = this.getCssRules(mxUtils.getTextContent(styles[i]));
					
					for (var j = 0; j < rules.length; j++)
					{
						this.addSvgRule(container, rules[j], svg, styles[i],
							rules, j, regex, singleColorMode, setColorScheme);
					}
				}
			}
		}
	}
	catch (e)
	{
		// ignore
	}
	
	return container;
};

/**
 * Returns the color scheme defined in the given CSS string.
 */
StyleFormatPanel.prototype.getColorSchemeFromCss = function(cssString)
{
    var colorSchemeMatch = cssString.match(/color-scheme\s*:\s*([^;]+)/i);

    return colorSchemeMatch ? colorSchemeMatch[1].trim() : null;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel.prototype.addSvgRule = function(container, rule, svg, styleElem, rules,
	ruleIndex, regex, singleColorMode, setColorScheme)
{
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	
	if (regex.test(rule.selectorText))
	{
		var addStyleRule = mxUtils.bind(this, function(rule, key, label, tempSingleColorMode)
		{
			var value = mxUtils.trim(rule.style.getPropertyValue(key));

			if (value != '' && value.substring(0, 4) != 'url(')
			{
				var colorValue = value;
				
				if (colorValue == 'transparent')
				{
					colorValue = mxConstants.NONE;
				}
				else
				{
					var lightDark = mxUtils.isLightDarkColor(colorValue);

					if (lightDark && tempSingleColorMode)
					{
						tempSingleColorMode = false;
					}
					else if (!lightDark && !tempSingleColorMode)
					{
						colorValue = 'light-dark(' + colorValue +
							', ' + colorValue + ')';
					}
				}
				
				var option = this.createColorOption(label + ' ' + rule.selectorText, function()
				{
					return colorValue;
				}, mxUtils.bind(this, function(color)
				{
					rules[ruleIndex].style.setProperty(key, (color == mxConstants.NONE) ?
						'transparent' : mxUtils.getLightDarkColor(color).cssText);
					var cssTxt = '';

					if (setColorScheme && mxUtils.isLightDarkColor(rules[ruleIndex].style[key]))
					{
						svg.documentElement.style.colorScheme = 'light dark';
					}
					
					for (var i = 0; i < rules.length; i++) 
					{
						cssTxt += rules[i].cssText + ' ';
					}
					
					styleElem.textContent = cssTxt;
					var xml = mxUtils.getXml(svg.documentElement);
					
					graph.setCellStyles(mxConstants.STYLE_IMAGE, 'data:image/svg+xml,' +
						((window.btoa) ? btoa(unescape(encodeURIComponent(xml))) :
							Base64.encode(xml, true)),
						ui.getSelectionState().cells);
				}), '#ffffff',
				{
					install: function(apply)
					{
						// ignore
					},
					destroy: function()
					{
						// ignore
					}
				}, null, null, null, tempSingleColorMode);
				
				container.appendChild(option);
				container.style.display = '';
			}
		});
		
		addStyleRule(rule, 'fill', mxResources.get('fill'), singleColorMode);
		addStyleRule(rule, 'stroke', mxResources.get('line'), singleColorMode);
		addStyleRule(rule, 'stop-color', mxResources.get('gradient'), singleColorMode);
	}
};

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel.prototype.addEditOps = function(div)
{
	var ss = this.editorUi.getSelectionState();

	if (ss.cells.length == 1)
	{
		var editSelect = document.createElement('select');
		editSelect.style.position = 'relative';
		editSelect.style.marginBottom = '2px';
		editSelect.className = 'geFullWidthElement';
		
		var ops = ['edit', 'copyAsText', 'editLink', 'editShape', 'editImage',
			'editData', 'copyData', 'pasteData', 'editConnectionPoints',
			'editGeometry', 'editPolygon', 'editTooltip', 'editStyle'];
		var libs = null;

		if (this.editorUi.sidebar != null)
		{
			var keyStyle = this.editorUi.sidebar.getKeyStyle(ss.cells[0].style);
			libs = this.editorUi.sidebar.getLibsForStyle(keyStyle);

			// Adds open library action and updates search index when invoked
			// if no libs were found but the shape name is likely to be known
			if (libs == null && !this.editorUi.sidebar.isSearchIndexLoaded() &&
				ss.style.shape != null && String(ss.style.shape).
					substring(0, 8) == 'mxgraph.')
			{
				libs = [];
			}
		}

		if (libs != null)
		{
			ops.push('openLibrary');
		}

		for (var i = 0; i < ops.length; i++)
		{
			var action = this.editorUi.actions.get(ops[i]);

			if (action == null || action.enabled)
			{
				var editOption = document.createElement('option');
				editOption.setAttribute('value', ops[i]);
				var title = mxResources.get(ops[i]);
				mxUtils.write(editOption, title);

				if (action != null && action.shortcut != null)
				{
					title += ' (' + action.shortcut + ')';
				}

				editOption.setAttribute('title', title);
				editSelect.appendChild(editOption);
			}
		}

		if (editSelect.children.length > 1)
		{
			div.appendChild(editSelect);

			mxEvent.addListener(editSelect, 'change', mxUtils.bind(this, function(evt)
			{
				if (editSelect.value == 'openLibrary')
				{
					if (libs != null && libs.length == 0)
					{
						// Updates search index and tries again
						this.editorUi.sidebar.updateSearchIndex();
						var keyStyle = this.editorUi.sidebar.getKeyStyle(ss.cells[0].style);
						libs = this.editorUi.sidebar.getLibsForStyle(keyStyle);
					}

					if (libs != null && libs.length > 0)
					{
						this.editorUi.sidebar.openLibraries(libs);
					}
					else
					{
						this.editorUi.handleError({message: mxResources.get('objectNotFound')});
					}

					editSelect.value = 'edit';
				}
				else
				{
					var action = this.editorUi.actions.get(editSelect.value);
					editSelect.value = 'edit';

					if (action != null)
					{
						action.funct();
					}
				}
			}));
			
			if (ss.image)
			{
				var graph = this.editorUi.editor.graph;
				var state = graph.view.getState(graph.getSelectionCell());

				if (state != null && mxUtils.getValue(state.style, mxConstants.STYLE_IMAGE, null) != null)
				{
					var btn = mxUtils.button(mxResources.get('crop') + '...',
						mxUtils.bind(this, function(evt)
					{
						this.editorUi.actions.get('crop').funct();
					}));

					btn.setAttribute('title', mxResources.get('crop'));
					editSelect.style.width = '104px';
					btn.style.width = '104px';
					btn.style.position = 'relative';
					btn.style.top = '-1px';
					btn.style.marginLeft = '2px';
					btn.style.marginBottom = '1px';

					div.appendChild(btn);
				}
			}
		}
	}

	return div;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel.prototype.addFill = function(container)
{
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	var ss = ui.getSelectionState();

	// Adds gradient direction option
	var gradientSelect = document.createElement('select');
	gradientSelect.setAttribute('title', mxResources.get('gradient'));
	gradientSelect.style.position = 'absolute';
	gradientSelect.style.left = '76px';
	gradientSelect.style.width = '86px';

	var fillStyleSelect = gradientSelect.cloneNode(false);
	fillStyleSelect.setAttribute('title', mxResources.get('fill'));
	
	// Stops events from bubbling to color option event handler
	mxEvent.addListener(gradientSelect, 'click', function(evt)
	{
		mxEvent.consume(evt);
	});
	mxEvent.addListener(fillStyleSelect, 'click', function(evt)
	{
		mxEvent.consume(evt);
	});
	
	var gradientPanel = this.createCellColorOption(mxResources.get('gradient'),
		mxConstants.STYLE_GRADIENTCOLOR, 'default', function(color)
	{
		if (color == null || color == mxConstants.NONE)
		{
			gradientSelect.style.display = 'none';
		}
		else
		{
			gradientSelect.style.display = '';
		}
	}, function(color)
	{
		graph.updateCellStyles({'gradientColor': color}, graph.getSelectionCells());
	}, graph.getDefaultColor(ss.style, mxConstants.STYLE_GRADIENTCOLOR,
		graph.shapeForegroundColor, graph.shapeBackgroundColor));
	
	gradientPanel.style.fontWeight = 'bold';

	var fillKey = (ss.style.shape == 'image') ? mxConstants.STYLE_IMAGE_BACKGROUND : mxConstants.STYLE_FILLCOLOR;

	var fillPanel = this.createCellColorOption(mxResources.get('fill'),
		fillKey, 'default', null, mxUtils.bind(this, function(color)
	{
		graph.setCellStyles(fillKey, color, ss.cells);
	}), graph.getDefaultColor(ss.style, fillKey, graph.shapeBackgroundColor,
		graph.shapeForegroundColor));

	fillPanel.style.fontWeight = 'bold';
	var tmpColor = mxUtils.getValue(ss.style, fillKey, null);
	gradientPanel.style.display = (tmpColor != null && tmpColor != mxConstants.NONE &&
		ss.fill && ss.style.shape != 'image') ? '' : 'none';

	var directions = [mxConstants.DIRECTION_NORTH, mxConstants.DIRECTION_EAST,
	                  mxConstants.DIRECTION_SOUTH, mxConstants.DIRECTION_WEST,
					  mxConstants.DIRECTION_RADIAL];

	for (var i = 0; i < directions.length; i++)
	{
		var gradientOption = document.createElement('option');
		gradientOption.setAttribute('value', directions[i]);
		mxUtils.write(gradientOption, mxResources.get(directions[i]));
		gradientSelect.appendChild(gradientOption);
	}
	
	gradientPanel.appendChild(gradientSelect);
	
	var curFillStyle;

	function populateFillStyle()
	{
		fillStyleSelect.innerHTML = '';
		curFillStyle = 1;
		
		for (var i = 0; i < Editor.fillStyles.length; i++)
		{
			var fillStyleOption = document.createElement('option');
			fillStyleOption.setAttribute('value', Editor.fillStyles[i].val);
			mxUtils.write(fillStyleOption, Editor.fillStyles[i].dispName);
			fillStyleSelect.appendChild(fillStyleOption);
		}
	};

	function populateRoughFillStyle()
	{
		fillStyleSelect.innerHTML = '';
		curFillStyle = 2;

		for (var i = 0; i < Editor.roughFillStyles.length; i++)
		{
			var fillStyleOption = document.createElement('option');
			fillStyleOption.setAttribute('value', Editor.roughFillStyles[i].val);
			mxUtils.write(fillStyleOption, Editor.roughFillStyles[i].dispName);
			fillStyleSelect.appendChild(fillStyleOption);
		}

		fillStyleSelect.value = 'auto';
	};

	populateFillStyle();

	if (ss.gradient)
	{
		fillPanel.appendChild(fillStyleSelect);
	}

	var listener = mxUtils.bind(this, function()
	{
		ss = ui.getSelectionState();
		var value = mxUtils.getValue(ss.style, mxConstants.STYLE_GRADIENT_DIRECTION,
			mxConstants.DIRECTION_SOUTH);
		var fillStyle = mxUtils.getValue(ss.style, 'fillStyle', 'auto');
		
		// Handles empty string which is not allowed as a value
		if (value == '')
		{
			value = mxConstants.DIRECTION_SOUTH;
		}
		
		gradientSelect.value = value;
		container.style.display = (ss.fill) ? '' : 'none';
		
		var fillColor = mxUtils.getValue(ss.style, fillKey, null);
		
		if (!ss.fill || fillColor == null || fillColor == mxConstants.NONE ||
			ss.style.shape == 'filledEdge')
		{
			fillStyleSelect.style.display = 'none';
			gradientPanel.style.display = 'none';
		}
		else
		{
			if (ss.style.sketch == '1')
			{
				if (curFillStyle != 2)
				{
					populateRoughFillStyle()
				}
			}
			else if (curFillStyle != 1)
			{
				populateFillStyle();
			}
			
			fillStyleSelect.value = fillStyle;

			//In case of switching from sketch to regular and fill type is not there
			if (!fillStyleSelect.value)
			{
				fillStyle = 'auto';
				fillStyleSelect.value = fillStyle;
			}

			fillStyleSelect.style.display = ss.style.sketch == '1' ||
				gradientSelect.style.display == 'none'? '' : 'none';
			gradientPanel.style.display = (ss.gradient &&
				!ss.containsImage && (ss.style.sketch != '1' ||
				fillStyle == 'solid' || fillStyle == 'auto')) ?
				'' : 'none';
		}
	});
	
	graph.getModel().addListener(mxEvent.CHANGE, listener);
	this.listeners.push({destroy: function() { graph.getModel().removeListener(listener); }});
	listener();

	mxEvent.addListener(gradientSelect, 'change', function(evt)
	{
		graph.setCellStyles(mxConstants.STYLE_GRADIENT_DIRECTION, gradientSelect.value, ss.cells);
		ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_GRADIENT_DIRECTION],
			'values', [gradientSelect.value], 'cells', ss.cells));
		mxEvent.consume(evt);
	});
	
	mxEvent.addListener(fillStyleSelect, 'change', function(evt)
	{
		graph.setCellStyles('fillStyle', fillStyleSelect.value, ss.cells);
		ui.fireEvent(new mxEventObject('styleChanged', 'keys', ['fillStyle'],
			'values', [fillStyleSelect.value], 'cells', ss.cells));
		mxEvent.consume(evt);
	});
	
	container.appendChild(fillPanel);
	container.appendChild(gradientPanel);

	// Makes sure every color key appeary only once
	var ignoredColors = {};

	// Adds custom colors
	var custom = this.getCustomColors();
	
	for (var i = 0; i < custom.length; i++)
	{
		if (!ignoredColors[custom[i].key])
		{
			ignoredColors[custom[i].key] = true;
			container.appendChild(this.createCellColorOption(custom[i].title,
				custom[i].key, custom[i].defaultValue, null, null,
				custom[i].defaultColorValue, custom[i].undefinedColor,
				true));
		}
	}

	// Adds custom colors from fill-/strokeColorStyles
	var addColorStyles = mxUtils.bind(this, function(colorStyles, defaultValues, defaultColor)
	{
		if (colorStyles != null)
		{
			var tokens = colorStyles.split(',');
			var defaultTokens = (defaultValues != null) ?
				defaultValues.split(',') : null;
			
			for (var i = 0; i < tokens.length; i++)
			{
				if (!ignoredColors[tokens[i]])
				{
					ignoredColors[tokens[i]] = true;
					var defaultValue = (defaultTokens != null) ?
						defaultTokens[mxUtils.mod(i,
							defaultTokens.length)] : null;
					var actualDefault = (defaultValue != null) ?
						defaultValue : 'default';
					container.appendChild(this.createCellColorOption(
						Editor.getLabelForStylename(tokens[i]),
						tokens[i], actualDefault, null, null,
						defaultColor, defaultValue, true));
				}
			}
		}
	});
	
	addColorStyles(ss.style.fillColorStyles, ss.style.defaultFillColors,
		graph.shapeBackgroundColor);
	addColorStyles(ss.style.strokeColorStyles, ss.style.defaultStrokeColors,
		graph.shapeForegroundColor);

	return container;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel.prototype.getCustomColors = function()
{
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	var ss = ui.getSelectionState();
	var result = [];

	if (ss.customProperties != null)
	{
		for (var key in ss.customProperties)
		{
			var prop = ss.customProperties[key];

			if (prop != null && prop.primary &&
				(prop.type == 'color' || prop.subType == 'color') &&
				(typeof(prop.isVisible) !== 'function' ||
				prop.isVisible(ss, this)))
			{
				var defaultColor = (prop.subType == 'color') ?
					prop.subDefVal : prop.defVal;
				defaultColor = (defaultColor != null) ?
					defaultColor : graph.shapeBackgroundColor;
				result.push({title: prop.dispName,
					defaultValue: defaultColor,
					defaultColorValue: (prop.defaultColor != null) ?
						prop.defaultColor : defaultColor,
					undefinedColor: prop.undefinedColor,
					key: prop.name});
			}
		}
	}

	if (ss.swimlane)
	{
		var graph = this.editorUi.editor.graph;
		result.push({title: mxResources.get('laneColor'),
			key: 'swimlaneFillColor', defaultValue: 'default',
			defaultColorValue: graph.shapeBackgroundColor});
	}
	
	return result;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel.prototype.addDashPattern = function(elt, pattern)
{
	var tokens = pattern.split(' ');

	if (tokens.length >= 2)
	{
		var sum = 0;

		for (var i = 0; i < tokens.length; i++)
		{
			sum += parseInt(tokens[i]);
		}
		
		var img = Graph.createSvgImage(sum, 1, '<line transform="translate(0,1)" x1="0" y1="0" x2="' + sum +
			'" y2="0" stroke-dasharray="' + pattern + '" stroke-width="2" stroke="black"/>', sum, 1);
		elt.style.backgroundImage = 'url(' + img.src + ')';
		elt.style.backgroundSize = sum + 'px 1px';
		elt.style.backgroundRepeat = 'repeat-x';
	}
	else
	{
		elt.style.borderBottomStyle = pattern;
	}
};

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel.prototype.addStroke = function(container)
{
	var panel = this;
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	var ss = ui.getSelectionState();
	
	var colorPanel = document.createElement('div');
	colorPanel.className = 'geFormatEntry';
	
	if (!ss.stroke)
	{
		colorPanel.style.display = 'none';
	}
	
	// Adds path style option
	var styleSelect = document.createElement('select');
	styleSelect.setAttribute('title', mxResources.get('style'));
	styleSelect.style.position = 'absolute';
	styleSelect.style.left = '72px';
	styleSelect.style.width = '90px';

	var styles = ['sharp', 'rounded', 'curved'];

	for (var i = 0; i < styles.length; i++)
	{
		var styleOption = document.createElement('option');
		styleOption.setAttribute('value', styles[i]);
		mxUtils.write(styleOption, mxResources.get(styles[i]));
		styleSelect.appendChild(styleOption);
	}
	
	mxEvent.addListener(styleSelect, 'change', function(evt)
	{
		graph.getModel().beginUpdate();
		try
		{
			var keys = [mxConstants.STYLE_ROUNDED, mxConstants.STYLE_CURVED];
			var values = ['0', '0'];
			
			if (styleSelect.value == 'rounded')
			{
				values = ['1', '0'];
			}
			else if (styleSelect.value == 'curved')
			{
				values = ['0', '1'];
			}
			
			for (var i = 0; i < keys.length; i++)
			{
				graph.setCellStyles(keys[i], values[i], ss.cells);
			}
			
			ui.fireEvent(new mxEventObject('styleChanged', 'keys', keys,
				'values', values, 'cells', ss.cells));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
		
		mxEvent.consume(evt);
	});
	
	// Stops events from bubbling to color option event handler
	mxEvent.addListener(styleSelect, 'click', function(evt)
	{
		mxEvent.consume(evt);
	});

	var strokeKey = (ss.style.shape == 'image') ? mxConstants.STYLE_IMAGE_BORDER : mxConstants.STYLE_STROKECOLOR;
	var label = (ss.style.shape == 'image') ? mxResources.get('border') : mxResources.get('line');

	var lineColor = this.createCellColorOption(label, strokeKey, 'default', null, mxUtils.bind(this, function(color)
	{
		graph.setCellStyles(strokeKey, color, ss.cells);

		// Sets strokeColor to inherit for rows and cells in tables
		if (color == null || color == mxConstants.NONE)
		{
			var tableCells = [];

			for (var i = 0; i < ss.cells.length; i++)
			{
				if (graph.isTableCell(ss.cells[i]) ||
					graph.isTableRow(ss.cells[i]))
				{
					tableCells.push(ss.cells[i]);
				}
			}

			if (tableCells.length > 0)
			{
				graph.setCellStyles(strokeKey, 'inherit', tableCells);
			}
		}
	}), graph.shapeForegroundColor);
	
	lineColor.style.fontWeight = 'bold';
	lineColor.appendChild(styleSelect);
	
	// Used if only edges selected
	var stylePanel = colorPanel.cloneNode(false);
	stylePanel.style.position = 'relative';

	var addItem = mxUtils.bind(this, function(menu, width, pattern, keys, values)
	{
		var item = this.editorUi.menus.styleChange(menu, '', keys, values, '');
		var pat = document.createElement('div');
		this.addDashPattern(pat, pattern);
		item.firstChild.firstChild.className = 'geStyleMenuItem';
		item.firstChild.firstChild.style.width = width + 'px';
		item.firstChild.firstChild.appendChild(pat);

		return item;
	});

	var dashKeys = [mxConstants.STYLE_DASHED, mxConstants.STYLE_DASH_PATTERN];

	function createCustomDiv(width)
	{
		var customDiv = document.createElement('div');
		mxUtils.write(customDiv, mxResources.get('custom'));
		customDiv.setAttribute('title', mxResources.get('custom'));
		customDiv.className = 'geStyleMenuItem';
		customDiv.style.textAlign = 'center';
		customDiv.style.display = 'block';
		customDiv.style.textOverflow = 'ellipsis';
		customDiv.style.overflow = 'hidden';
		customDiv.style.maxWidth = width + 'px';
		customDiv.style.fontSize = '12px';

		return customDiv;
	};
	
	var pattern = ui.toolbar.addMenu(new Menu(mxUtils.bind(this, function(menu)
	{
		addItem(menu, 110, 'solid', dashKeys, [null, null]).setAttribute('title', mxResources.get('solid'));
		addItem(menu, 110, 'dashed', dashKeys, ['1', null]).setAttribute('title', mxResources.get('dashed') + ' (1)');
		addItem(menu, 110, '8 8', dashKeys, ['1', '8 8']).setAttribute('title', mxResources.get('dashed') + ' (2)');
		addItem(menu, 110, '12 12', dashKeys, ['1', '12 12']).setAttribute('title', mxResources.get('dashed') + ' (3)');
		addItem(menu, 110, '8 4 1 4', dashKeys, ['1', '8 4 1 4']).setAttribute('title', mxResources.get('dashed') + ' (4)');
		addItem(menu, 110, 'dotted', dashKeys, ['1', '1 1']).setAttribute('title', mxResources.get('dotted') + ' (1)');
		addItem(menu, 110, '1 2', dashKeys, ['1', '1 2']).setAttribute('title', mxResources.get('dotted') + ' (2)');
		addItem(menu, 110, '1 4', dashKeys, ['1', '1 4']).setAttribute('title', mxResources.get('dotted') + ' (3)');

		menu.addItem('', null, mxUtils.bind(this, function()
		{
			ui.prompt(mxResources.get('pattern'), mxUtils.getValue(ss.style, mxConstants.STYLE_DASH_PATTERN, '8 4 1 4'),
				mxUtils.bind(this, function(newValue)
				{
					ui.menus.createStyleChangeFunction(dashKeys, ['1', newValue])();
				}), true);
		})).firstChild.appendChild(createCustomDiv(110));
	})), '', null, stylePanel);

	// Used for mixed selection (vertices and edges)
	var altStylePanel = stylePanel.cloneNode(false);

	var edgeShape = ui.toolbar.addMenu(new Menu(mxUtils.bind(this, function(menu)
	{
		var keys = [mxConstants.STYLE_SHAPE, mxConstants.STYLE_STARTSIZE, mxConstants.STYLE_ENDSIZE, mxConstants.STYLE_DASHED, 'width'];
		Format.processMenuIcon(this.editorUi.menus.styleChange(menu, '', keys, [null, null, null, null, null], '',
			null, null, null, true, Format.connectionImage.src)).setAttribute('title', mxResources.get('line'));
		Format.processMenuIcon(this.editorUi.menus.styleChange(menu, '', keys, ['link', null, null, null, null], '',
			null, null, null, true, Format.linkEdgeImage.src)).setAttribute('title', mxResources.get('link'));
		Format.processMenuIcon(this.editorUi.menus.styleChange(menu, '', keys, ['flexArrow', null, null, null, null], '',
			null, null, null, true, Format.arrowImage.src)).setAttribute('title', mxResources.get('arrow'));
		Format.processMenuIcon(this.editorUi.menus.styleChange(menu, '', keys, ['arrow', null, null, null, null], '',
			null, null, null, true, Format.simpleArrowImage.src)).setAttribute('title', mxResources.get('simpleArrow'));
		Format.processMenuIcon(this.editorUi.menus.styleChange(menu, '', keys, ['filledEdge', null, null, null, null], '',
			null, null, null, true, Format.filledEdgeImage.src)).setAttribute('title', 'Filled Edge');
		Format.processMenuIcon(this.editorUi.menus.styleChange(menu, '', keys, ['pipe', null, null, null, null], '',
			null, null, null, true, Format.pipeEdgeImage.src)).setAttribute('title', 'Pipe');
		Format.processMenuIcon(this.editorUi.menus.styleChange(menu, '', keys, ['wire', null, null, '1', null], '',
			null, null, null, true, Format.wireEdgeImage.src)).setAttribute('title', 'Wire');
	})), '', null, altStylePanel);

	edgeShape.setAttribute('title', mxResources.get('connection'));

	var altPattern = ui.toolbar.addMenu(new Menu(mxUtils.bind(this, function(menu)
	{
		addItem(menu, 44, 'solid', dashKeys, [null, null]).setAttribute('title', mxResources.get('solid'));
		addItem(menu, 44, 'dashed', dashKeys, ['1', null]).setAttribute('title', mxResources.get('dashed') + ' (1)');
		addItem(menu, 44, '8 8', dashKeys, ['1', '8 8']).setAttribute('title', mxResources.get('dashed') + ' (2)');
		addItem(menu, 44, '12 12', dashKeys, ['1', '12 12']).setAttribute('title', mxResources.get('dashed') + ' (3)');
		addItem(menu, 44, '8 4 1 4', dashKeys, ['1', '8 4 1 4']).setAttribute('title', mxResources.get('dashed') + ' (4)');
		addItem(menu, 44, 'dotted', dashKeys, ['1', '1 1']).setAttribute('title', mxResources.get('dotted') + ' (1)');
		addItem(menu, 44, '1 2', dashKeys, ['1', '1 2']).setAttribute('title', mxResources.get('dotted') + ' (2)');
		addItem(menu, 44, '1 4', dashKeys, ['1', '1 4']).setAttribute('title', mxResources.get('dotted') + ' (3)');
		
		menu.addItem('', null, mxUtils.bind(this, function()
		{
			ui.prompt(mxResources.get('pattern'), mxUtils.getValue(ss.style, mxConstants.STYLE_DASH_PATTERN, '8 4 1 4'),
				mxUtils.bind(this, function(newValue)
				{
					ui.menus.createStyleChangeFunction(dashKeys, ['1', newValue])();
				}), true);
		})).firstChild.appendChild(createCustomDiv(44));
	})), '', null, altStylePanel);
	
	var stylePanel2 = stylePanel.cloneNode(false);

	// Stroke width
	var input = document.createElement('input');
	input.style.position = 'absolute';
	input.style.width = '52px';
	input.style.left = '148px';
	input.setAttribute('title', mxResources.get('linewidth'));
	
	stylePanel.appendChild(input);
	
	var altInput = input.cloneNode(true);
	altInput.style.width = '56px';
	altInput.style.left = '144px';
	altStylePanel.appendChild(altInput);

	function update(evt)
	{
		// Maximum stroke width is 999
		var value = panel.fromUnit(parseFloat(input.value));
		value = Math.min(999, Math.max(0, (isNaN(value)) ? 1 : value));
		
		if (value != mxUtils.getValue(ss.style, mxConstants.STYLE_STROKEWIDTH, 1))
		{
			graph.setCellStyles(mxConstants.STYLE_STROKEWIDTH, value, ss.cells);
			ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_STROKEWIDTH],
					'values', [value], 'cells', ss.cells));
		}

		input.value = panel.inUnit(value) + ' ' + panel.getUnit();
		mxEvent.consume(evt);
	};

	function altUpdate(evt)
	{
		// Maximum stroke width is 999
		var value = panel.fromUnit(parseFloat(altInput.value));
		value = Math.min(999, Math.max(0, (isNaN(value)) ? 1 : value));
		
		if (value != mxUtils.getValue(ss.style, mxConstants.STYLE_STROKEWIDTH, 1))
		{
			graph.setCellStyles(mxConstants.STYLE_STROKEWIDTH, value, ss.cells);
			ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_STROKEWIDTH],
					'values', [value], 'cells', ss.cells));
		}

		altInput.value = panel.inUnit(value) + ' ' + panel.getUnit();
		mxEvent.consume(evt);
	};

	var stepper = this.createStepper(input, update, this.getUnitStep(), null, null, this.isFloatUnit());
	stepper.style.display = input.style.display;
	stylePanel.appendChild(stepper);

	var altStepper = this.createStepper(altInput, altUpdate, this.getUnitStep(), null, null, this.isFloatUnit());
	altStepper.style.display = altInput.style.display;
	altStylePanel.appendChild(altStepper);
	
	mxEvent.addListener(input, 'blur', update);
	mxEvent.addListener(input, 'change', update);

	mxEvent.addListener(altInput, 'blur', altUpdate);
	mxEvent.addListener(altInput, 'change', altUpdate);
	
	var edgeStyle = ui.toolbar.addMenu(new Menu(mxUtils.bind(this, function(menu)
	{
		if (ss.style.shape != 'arrow')
		{
			Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_EDGE, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE],
				[null, null, null], null, null, true, Format.straightImage.src)).setAttribute('title', mxResources.get('straight'));
			Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_EDGE, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE],
				['orthogonalEdgeStyle', null, null], null, null, true, Format.orthogonalImage.src)).setAttribute('title', mxResources.get('orthogonal'));
			Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_EDGE, mxConstants.STYLE_ELBOW, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE],
				['elbowEdgeStyle', 'vertical', null, null], null, null, true, Format.verticalElbowImage.src)).setAttribute('title', mxResources.get('horizontal'));
			Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_EDGE, mxConstants.STYLE_ELBOW, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE],
				['elbowEdgeStyle', null, null, null], null, null, true, Format.horizontalElbowImage.src)).setAttribute('title', mxResources.get('vertical'));
			Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_EDGE, mxConstants.STYLE_ELBOW, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE],
				['isometricEdgeStyle', null, null, null], null, null, true, Format.horizontalIsometricImage.src)).setAttribute('title', mxResources.get('isometric'));
			Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_EDGE, mxConstants.STYLE_ELBOW, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE],
				['isometricEdgeStyle', 'vertical', null, null], null, null, true, Format.verticalIsometricImage.src)).setAttribute('title', mxResources.get('isometric'));
			
			if (ss.style.shape == 'connector')
			{
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_EDGE, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE],
					['orthogonalEdgeStyle', '1', null], null, null, true, Format.curvedImage.src)).setAttribute('title', mxResources.get('curved'));
			}
			
			Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_EDGE, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE],
				['entityRelationEdgeStyle', null, null], null, null, true, Format.entityImage.src)).setAttribute('title', mxResources.get('entityRelation'));
		}
	})), '', null, stylePanel2);

	edgeStyle.setAttribute('title', mxResources.get('waypoints'));

	var lineStart = ui.toolbar.addMenu(new Menu(mxUtils.bind(this, function(menu)
	{
		if (ss.style.shape == 'connector' || ss.style.shape == 'flexArrow' || ss.style.shape == 'filledEdge' ||
			ss.style.shape == 'wire' || ss.style.shape == 'pipe' || ss.style.shape == 'mxgraph.basic.arc')
		{
			// Copies other marker
			var otherMarker = mxUtils.getValue(ss.style, mxConstants.STYLE_ENDARROW, mxConstants.NONE);
			var otherFill = mxUtils.getValue(ss.style, 'endFill', '1');

			if (otherMarker != mxConstants.NONE &&
				(mxUtils.getValue(ss.style, mxConstants.STYLE_STARTARROW, mxConstants.NONE) != otherMarker ||
				mxUtils.getValue(ss.style, 'startSize', '1') != mxUtils.getValue(ss.style, 'endSize', '1') ||
				mxUtils.getValue(ss.style, 'startFill', '1') != otherFill))
			{
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '',
					[mxConstants.STYLE_STARTARROW, 'startFill', 'startSize'],
					[otherMarker, otherFill, mxUtils.getValue(ss.style, 'endSize')], null, null, false,
						ui.getImageForMarker(otherMarker, otherFill, ss.style.shape, ss.style.shape))).
							setAttribute('title', mxResources.get('copy'));
			}
			
			Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
				[mxConstants.NONE, 0], null, null, false, Format.noMarkerImage.src)).setAttribute('title', mxResources.get('none'));
			
			if (ss.style.shape == 'connector' || ss.style.shape == 'filledEdge' ||
				ss.style.shape == 'wire' || ss.style.shape == 'pipe' ||
				ss.style.shape == 'mxgraph.basic.arc')
			{
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_CLASSIC, 1], null, null, false, Format.classicFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_CLASSIC_THIN, 1], null, null, false, Format.classicThinFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_OPEN, 0], null, null, false, Format.openFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_OPEN_THIN, 0], null, null, false, Format.openThinFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['openAsync', 0], null, null, false, Format.openAsyncFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_BLOCK, 1], null, null, false, Format.blockFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_BLOCK_THIN, 1], null, null, false, Format.blockThinFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['async', 1], null, null, false, Format.asyncFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_OVAL, 1], null, null, false, Format.ovalFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_DIAMOND, 1], null, null, false, Format.diamondFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_DIAMOND_THIN, 1], null, null, false, Format.diamondThinFilledMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_CLASSIC, 0], null, null, false, Format.classicMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_CLASSIC_THIN, 0], null, null, false, Format.classicThinMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_BLOCK, 0], null, null, false, Format.blockMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_BLOCK_THIN, 0], null, null, false, Format.blockThinMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['async', 0], null, null, false, Format.asyncMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_OVAL, 0], null, null, false, Format.ovalMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_DIAMOND, 0], null, null, false, Format.diamondMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					[mxConstants.ARROW_DIAMOND_THIN, 0], null, null, false, Format.diamondThinMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['box', 0], null, null, false, Format.boxMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['halfCircle', 0], null, null, false, Format.halfCircleMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['dash', 0], null, null, false, Format.dashMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['cross', 0], null, null, false, Format.crossMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['circlePlus', 0], null, null, false, Format.circlePlusMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['circle', 1], null, null, false, Format.circleMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['baseDash', 0], null, null, false, Format.baseDashMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['ERone', 0], null, null, false, Format.EROneMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['ERmandOne', 0], null, null, false, Format.ERmandOneMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['ERmany', 0], null, null, false, Format.ERmanyMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['ERoneToMany', 0], null, null, false, Format.ERoneToManyMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['ERzeroToOne', 0], null, null, false, Format.ERzeroToOneMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['ERzeroToMany', 0], null, null, false, Format.ERzeroToManyMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['doubleBlock', 0], null, null, false, Format.doubleBlockMarkerImage.src));
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW, 'startFill'],
					['doubleBlock', 1], null, null, false, Format.doubleBlockFilledMarkerImage.src));
			}
			else
			{
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_STARTARROW],
					[mxConstants.ARROW_BLOCK], null, null, false, Format.blockMarkerImage.src)).
						setAttribute('title', mxResources.get('block'));
			}

			menu.div.style.width = '40px';

			window.setTimeout(mxUtils.bind(this, function()
			{
				if (menu.div != null)
				{
					mxUtils.fit(menu.div);
				}
			}), 0);
		}
	})), '', null, stylePanel2);

	var lineEnd = ui.toolbar.addMenu(new Menu(mxUtils.bind(this, function(menu)
	{
		if (ss.style.shape == 'connector' || ss.style.shape == 'flexArrow' || ss.style.shape == 'filledEdge' ||
			ss.style.shape == 'wire' || ss.style.shape == 'pipe' || ss.style.shape == 'mxgraph.basic.arc')
		{
			// Copies other marker
			var otherMarker = mxUtils.getValue(ss.style, mxConstants.STYLE_STARTARROW, mxConstants.NONE);
			var otherFill = mxUtils.getValue(ss.style, 'startFill', '1');

			if (otherMarker != mxConstants.NONE &&
				(mxUtils.getValue(ss.style, mxConstants.STYLE_ENDARROW, mxConstants.NONE) != otherMarker ||
				mxUtils.getValue(ss.style, 'endSize', '1') != mxUtils.getValue(ss.style, 'startSize', '1') ||
				mxUtils.getValue(ss.style, 'endFill', '1') != otherFill))
			{
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '',
					[mxConstants.STYLE_ENDARROW, 'endFill', 'endSize'],
					[otherMarker, otherFill, mxUtils.getValue(ss.style, 'startSize')], null, null, false,
						ui.getImageForMarker(otherMarker, otherFill, ss.style.shape, ss.style.shape)),
							'scaleX(-1)').setAttribute('title', mxResources.get('copy'));
			}
			
			Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
				[mxConstants.NONE, 0], null, null, false, Format.noMarkerImage.src)).setAttribute('title', mxResources.get('none'));
			
			if (ss.style.shape == 'connector' || ss.style.shape == 'filledEdge' ||
				ss.style.shape == 'wire' || ss.style.shape == 'pipe' ||
				ss.style.shape == 'mxgraph.basic.arc')
			{
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_CLASSIC, 1], null, null, false, Format.classicFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_CLASSIC_THIN, 1], null, null, false, Format.classicThinFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_OPEN, 0], null, null, false, Format.openFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_OPEN_THIN, 0], null, null, false, Format.openThinFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['openAsync', 0], null, null, false, Format.openAsyncFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_BLOCK, 1], null, null, false, Format.blockFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_BLOCK_THIN, 1], null, null, false, Format.blockThinFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['async', 1], null, null, false, Format.asyncFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_OVAL, 1], null, null, false, Format.ovalFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_DIAMOND, 1], null, null, false, Format.diamondFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_DIAMOND_THIN, 1], null, null, false, Format.diamondThinFilledMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_CLASSIC, 0], null, null, false, Format.classicMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_CLASSIC_THIN, 0], null, null, false, Format.classicThinMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_BLOCK, 0], null, null, false, Format.blockMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_BLOCK_THIN, 0], null, null, false, Format.blockThinMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['async', 0], null, null, false, Format.asyncMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_OVAL, 0], null, null, false, Format.ovalMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_DIAMOND, 0], null, null, false, Format.diamondMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					[mxConstants.ARROW_DIAMOND_THIN, 0], null, null, false, Format.diamondThinMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['box', 0], null, null, false, Format.boxMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['halfCircle', 0], null, null, false, Format.halfCircleMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['dash', 0], null, null, false, Format.dashMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['cross', 0], null, null, false, Format.crossMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['circlePlus', 0], null, null, false, Format.circlePlusMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['circle', 0], null, null, false, Format.circleMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['baseDash', 0], null, null, false, Format.baseDashMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['ERone', 0], null, null, false, Format.EROneMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['ERmandOne', 0], null, null, false, Format.ERmandOneMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['ERmany', 0], null, null, false, Format.ERmanyMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['ERoneToMany', 0], null, null, false, Format.ERoneToManyMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['ERzeroToOne', 0], null, null, false, Format.ERzeroToOneMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['ERzeroToMany', 0], null, null, false, Format.ERzeroToManyMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['doubleBlock', 0], null, null, false, Format.doubleBlockMarkerImage.src), 'scaleX(-1)');
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW, 'endFill'],
					['doubleBlock', 1], null, null, false, Format.doubleBlockFilledMarkerImage.src), 'scaleX(-1)');
			}
			else
			{
				Format.processMenuIcon(this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_ENDARROW],
					[mxConstants.ARROW_BLOCK], null, null, false, Format.blockMarkerImage.src), 'scaleX(-1)').
						setAttribute('title', mxResources.get('block'));
			}

			menu.div.style.width = '40px';

			window.setTimeout(mxUtils.bind(this, function()
			{
				if (menu.div != null)
				{
					mxUtils.fit(menu.div);
				}
			}), 0);
		}
	})), '', null, stylePanel2);

	edgeShape.style.width = '67px';
	edgeShape.style.marginRight = '2px';
	altPattern.style.width = '67px';
	altPattern.style.marginRight = '2px';
	edgeStyle.style.width = '67px';
	edgeStyle.style.marginRight = '2px';
	lineStart.style.width = '67px';
	lineStart.style.marginRight = '2px';
	lineEnd.style.width = '67px';
	lineEnd.style.marginRight = '2px';

	this.addArrow(edgeShape).appendChild(document.createElement('div'));
	this.addArrow(edgeStyle).appendChild(document.createElement('div'));
	this.addArrow(lineStart);
	this.addArrow(lineEnd);
	
	pattern.style.width = '142px';
	var symbol = this.addArrow(pattern);
	var altSymbol = this.addArrow(altPattern);
	
	var solid = document.createElement('div');
	solid.className = 'gePatternPreview';
	solid.style.width = '100px';
	solid.style.borderBottomStyle = 'solid';
	symbol.appendChild(solid);
	
	var altSolid = document.createElement('div');
	altSolid.className = 'gePatternPreview';
	altSolid.style.width = '36px';
	altSolid.style.borderBottomStyle = 'solid';
	altSymbol.appendChild(altSolid);

	container.appendChild(lineColor);
	container.appendChild(altStylePanel);
	container.appendChild(stylePanel);

	var arrowPanel = stylePanel.cloneNode(false);
	arrowPanel.style.display = 'block';
	arrowPanel.style.height = '60px';
	arrowPanel.style.paddingTop = '2px';
	arrowPanel.style.overflow = 'visible';
	
	var span = document.createElement('div');
	span.style.position = 'absolute';
	span.style.maxWidth = '78px';
	span.style.overflow = 'hidden';
	span.style.textOverflow = 'ellipsis';
	span.style.marginTop = '4px';
	span.style.fontWeight = 'normal';
	
	mxUtils.write(span, mxResources.get('size'));
	span.setAttribute('title', mxResources.get('size'));
	arrowPanel.appendChild(span);

	var startSpacingUpdate, startSizeUpdate, endSpacingUpdate, endSizeUpdate;

	var startSize = this.addUnitInput(arrowPanel, this.getUnit(), 82, 52, function()
	{
		startSizeUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	startSize.setAttribute('title', mxResources.get('linestart'));

	var endSize = this.addUnitInput(arrowPanel, this.getUnit(), 16, 52, function()
	{
		endSizeUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	endSize.setAttribute('title', mxResources.get('lineend'));

	mxUtils.br(arrowPanel);
	
	var spacer = document.createElement('div');
	spacer.style.height = '8px';
	arrowPanel.appendChild(spacer);
	
	var spacingLabel = span.cloneNode(false);
	span = spacingLabel;
	mxUtils.write(span, mxResources.get('spacing'));
	span.setAttribute('title', mxResources.get('spacing'));
	arrowPanel.appendChild(span);

	var startSpacing = this.addUnitInput(arrowPanel, this.getUnit(), 82, 52, function()
	{
		startSpacingUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	startSpacing.setAttribute('title', mxResources.get('linestart'));

	var endSpacing = this.addUnitInput(arrowPanel, this.getUnit(), 16, 52, function()
	{
		endSpacingUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	endSpacing.setAttribute('title', mxResources.get('lineend'));

	mxUtils.br(arrowPanel);
	this.addLabel(arrowPanel, mxResources.get('linestart'), 82, 62).style.fontSize = '10px';
	this.addLabel(arrowPanel, mxResources.get('lineend'), 16, 62).style.fontSize = '10px';
	mxUtils.br(arrowPanel);
	
	var perimeterPanel = colorPanel.cloneNode(false);
	perimeterPanel.className = 'geFormatEntry';
	
	var span = document.createElement('div');
	mxUtils.write(span, mxResources.get('perimeter'));
	span.setAttribute('title', mxResources.get('perimeter'));
	perimeterPanel.appendChild(span);

	var perimeterUpdate;
	var perimeterSpacing = this.addUnitInput(perimeterPanel, this.getUnit(), 16, 52, function()
	{
		perimeterUpdate.apply(this, arguments);
	}, this.getUnitStep(), null, null, this.isFloatUnit());
	perimeterSpacing.setAttribute('title', mxResources.get('perimeter'));

	if (ss.edges.length == ss.cells.length)
	{
		container.appendChild(stylePanel2);
		container.appendChild(arrowPanel);
	}
	else if (ss.vertices.length == ss.cells.length)
	{
		if (ss.style.shape == 'mxgraph.basic.arc')
		{
			edgeStyle.style.visibility = 'hidden';
			container.appendChild(stylePanel2);
			spacer.style.display = 'none';
			spacingLabel.style.display = 'none';
			startSpacing.style.display = 'none';
			startSpacing.nextSibling.style.display = 'none';
			endSpacing.style.display = 'none';
			endSpacing.nextSibling.style.display = 'none';
			container.appendChild(arrowPanel);
		}

		container.appendChild(perimeterPanel);
	}
	
	var listener = mxUtils.bind(this, function(sender, evt, force)
	{
		ss = ui.getSelectionState();

		if (force || document.activeElement != input)
		{
			var tmp = parseFloat(mxUtils.getValue(ss.style, mxConstants.STYLE_STROKEWIDTH, 1));
			input.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}
		
		if (force || document.activeElement != altInput)
		{
			var tmp = parseFloat(mxUtils.getValue(ss.style, mxConstants.STYLE_STROKEWIDTH, 1));
			altInput.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}
		
		styleSelect.style.visibility = (ss.style.shape == 'connector' ||
			ss.style.shape == 'filledEdge' || ss.style.shape == 'wire' ||
			ss.style.shape == 'pipe') ? '' : 'hidden';
		
		if (mxUtils.getValue(ss.style, mxConstants.STYLE_CURVED, null) == '1')
		{
			styleSelect.value = 'curved';
		}
		else if (mxUtils.getValue(ss.style, mxConstants.STYLE_ROUNDED, null) == '1')
		{
			styleSelect.value = 'rounded';
		}

		solid.style.borderBottom = '1px solid black';
		
		if (mxUtils.getValue(ss.style, mxConstants.STYLE_DASHED, null) == '1')
		{
			var pat = mxUtils.getValue(ss.style, mxConstants.STYLE_DASH_PATTERN, '');
			var tokens = String(pat).split(' ');

			if (tokens.length >= 2)
			{
				solid.style.borderBottom = '1px solid transparent';
				this.addDashPattern(solid, pat);
			}
			else
			{
				solid.style.borderBottom = '1px dashed black';
			}
		}

		altSolid.style.backgroundImage = solid.style.backgroundImage;
		altSolid.style.backgroundPosition = solid.style.backgroundPosition;
		altSolid.style.backgroundSize = solid.style.backgroundSize;
		altSolid.style.backgroundRepeat = solid.style.backgroundRepeat;
		altSolid.style.borderBottom = solid.style.borderBottom;
		
		// Updates toolbar icon for edge style
		var edgeStyleDiv = edgeStyle.getElementsByTagName('div')[1];
		
		if (edgeStyleDiv != null)
		{
			edgeStyleDiv.style.backgroundImage = 'url(' + ui.getImageForEdgeStyle(ss.style) + ')';
		}
		
		// Updates icon for edge shape
		var edgeShapeDiv = edgeShape.getElementsByTagName('div')[1];
		
		if (edgeShapeDiv != null)
		{
			edgeShapeDiv.style.backgroundImage = 'url(' + ui.getImageForEdgeShape(ss.style) + ')';
		}
		
		if (ss.edges.length == ss.cells.length)
		{
			altStylePanel.style.display = '';
			stylePanel.style.display = 'none';
		}
		else
		{
			altStylePanel.style.display = 'none';
			stylePanel.style.display = '';
		}

		if (Graph.lineJumpsEnabled && ss.edges.length > 0 &&
			ss.vertices.length == 0 && ss.lineJumps)
		{
			container.style.borderBottomStyle = 'none';
		}

		function updateArrow(marker, fill, elt, prefix)
		{
			var markerDiv = elt.getElementsByTagName('div')[0];
			
			if (markerDiv != null)
			{
				ui.updateCssForMarker(markerDiv, prefix, ss.style.shape, marker, fill);
			}
			
			return markerDiv;
		};
		
		updateArrow(mxUtils.getValue(ss.style, mxConstants.STYLE_STARTARROW, null),
				mxUtils.getValue(ss.style, 'startFill', '1'), lineStart, 'start');
		updateArrow(mxUtils.getValue(ss.style, mxConstants.STYLE_ENDARROW, null),
				mxUtils.getValue(ss.style, 'endFill', '1'), lineEnd, 'end');

		mxUtils.setOpacity(edgeStyle, (ss.style.shape == 'arrow') ? 30 : 100);			
		
		if (ss.style.shape != 'connector' && ss.style.shape != 'flexArrow' &&
			ss.style.shape != 'filledEdge' && ss.style.shape != 'wire' &&
			ss.style.shape != 'pipe' && ss.style.shape != 'mxgraph.basic.arc')
		{
			mxUtils.setOpacity(lineStart, 30);
			mxUtils.setOpacity(lineEnd, 30);
		}

		if (force || document.activeElement != startSize)
		{
			var tmp = parseInt(mxUtils.getValue(ss.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_MARKERSIZE));
			startSize.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}
		
		if (force || document.activeElement != startSpacing)
		{
			var tmp = parseInt(mxUtils.getValue(ss.style, mxConstants.STYLE_SOURCE_PERIMETER_SPACING, 0));
			startSpacing.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}

		if (force || document.activeElement != endSize)
		{
			var tmp = parseInt(mxUtils.getValue(ss.style, mxConstants.STYLE_ENDSIZE, mxConstants.DEFAULT_MARKERSIZE));
			endSize.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}
		
		if (force || document.activeElement != startSpacing)
		{
			var tmp = parseInt(mxUtils.getValue(ss.style, mxConstants.STYLE_TARGET_PERIMETER_SPACING, 0));
			endSpacing.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}
		
		if (force || document.activeElement != perimeterSpacing)
		{
			var tmp = parseInt(mxUtils.getValue(ss.style, mxConstants.STYLE_PERIMETER_SPACING, 0));
			perimeterSpacing.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
		}
	});
	
	startSizeUpdate = this.installInputHandler(startSize, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_MARKERSIZE, 0, 999, 
		this.getUnit(' '), null, this.isFloatUnit(), true);
	startSpacingUpdate = this.installInputHandler(startSpacing, mxConstants.STYLE_SOURCE_PERIMETER_SPACING, 0, -999, 999, 
		this.getUnit(' '), null, this.isFloatUnit(), true);
	endSizeUpdate = this.installInputHandler(endSize, mxConstants.STYLE_ENDSIZE, mxConstants.DEFAULT_MARKERSIZE, 0, 999, 
		this.getUnit(' '), null, this.isFloatUnit(), true);
	endSpacingUpdate = this.installInputHandler(endSpacing, mxConstants.STYLE_TARGET_PERIMETER_SPACING, 0, -999, 999, 
		this.getUnit(' '), null, this.isFloatUnit(), true);
	perimeterUpdate = this.installInputHandler(perimeterSpacing, mxConstants.STYLE_PERIMETER_SPACING, 0, 0, 999, 
		this.getUnit(' '), null, this.isFloatUnit(), true);

	this.addKeyHandler(input, listener);
	this.addKeyHandler(startSize, listener);
	this.addKeyHandler(startSpacing, listener);
	this.addKeyHandler(endSize, listener);
	this.addKeyHandler(endSpacing, listener);
	this.addKeyHandler(perimeterSpacing, listener);

	graph.getModel().addListener(mxEvent.CHANGE, listener);
	this.listeners.push({destroy: function() { graph.getModel().removeListener(listener); }});
	listener();

	return container;
};

/**
 * Adds UI for configuring line jumps.
 */
StyleFormatPanel.prototype.addLineJumps = function(container)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	var ss = ui.getSelectionState();
	container.style.height = '22px';
	
	if (Graph.lineJumpsEnabled && ss.edges.length > 0 &&
		ss.vertices.length == 0 && ss.lineJumps)
	{
		container.style.display = 'flex';
		container.style.alignItems = 'center';
		
		var span = document.createElement('div');
		span.style.position = 'absolute';
		span.style.maxWidth = '72px';
		span.style.overflow = 'hidden';
		span.style.textOverflow = 'ellipsis';
		
		mxUtils.write(span, mxResources.get('lineJumps'));
		span.setAttribute('title', mxResources.get('lineJumps'));
		container.appendChild(span);

		var styleSelect = document.createElement('select');
		styleSelect.setAttribute('title', mxResources.get('lineJumps'));
		styleSelect.style.left = '72px';
		styleSelect.style.width = '72px';

		var styles = ['none', 'arc', 'gap', 'sharp', 'line'];

		for (var i = 0; i < styles.length; i++)
		{
			var styleOption = document.createElement('option');
			styleOption.setAttribute('value', styles[i]);
			mxUtils.write(styleOption, mxResources.get(styles[i]));
			styleSelect.appendChild(styleOption);
		}
		
		mxEvent.addListener(styleSelect, 'change', function(evt)
		{
			graph.getModel().beginUpdate();
			try
			{
				graph.setCellStyles('jumpStyle', styleSelect.value, ss.cells);
				ui.fireEvent(new mxEventObject('styleChanged', 'keys', ['jumpStyle'],
					'values', [styleSelect.value], 'cells', ss.cells));
			}
			finally
			{
				graph.getModel().endUpdate();
			}
			
			mxEvent.consume(evt);
		});
		
		// Stops events from bubbling to color option event handler
		mxEvent.addListener(styleSelect, 'click', function(evt)
		{
			mxEvent.consume(evt);
		});
		
		container.appendChild(styleSelect);
		
		var jumpSizeUpdate;
		
		var jumpSize = this.addUnitInput(container, this.getUnit(), 16, 52, function()
		{
			jumpSizeUpdate.apply(this, arguments);
		}, this.getUnitStep(), null, null, this.isFloatUnit());
		jumpSize.setAttribute('title', mxResources.get('size'));

		jumpSizeUpdate = this.installInputHandler(jumpSize, 'jumpSize', Graph.defaultJumpSize,
				0, 999, this.getUnit(' '), null, this.isFloatUnit(), true);
		
		var listener = mxUtils.bind(this, function(sender, evt, force)
		{
			ss = ui.getSelectionState();
			styleSelect.value = mxUtils.getValue(ss.style, 'jumpStyle', 'none');

			if (force || document.activeElement != jumpSize)
			{
				var tmp = parseInt(mxUtils.getValue(ss.style, 'jumpSize', Graph.defaultJumpSize));
				jumpSize.value = (isNaN(tmp)) ? '' : this.inUnit(tmp) + ' ' + this.getUnit();
			}
		});

		this.addKeyHandler(jumpSize, listener);

		graph.getModel().addListener(mxEvent.CHANGE, listener);
		this.listeners.push({destroy: function() { graph.getModel().removeListener(listener); }});
		listener();
	}
	else
	{
		container.style.display = 'none';
	}
	
	return container;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel.prototype.addEffects = function(div)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	var ss = ui.getSelectionState();

	var table = document.createElement('table');
	table.className = 'geFullWidthElement';
	table.style.fontWeight = 'bold';
	table.style.tableLayout = 'fixed';
	var tbody = document.createElement('tbody');
	var row = document.createElement('tr');
	row.style.padding = '0px';
	var left = document.createElement('td');
	left.style.padding = '0px';
	left.style.width = '50%';
	left.style.verticalAlign = 'top';
	
	var right = left.cloneNode(true);
	right.style.paddingLeft = '8px';
	row.appendChild(left);
	row.appendChild(right);
	tbody.appendChild(row);
	table.appendChild(tbody);
	div.appendChild(table);

	var current = left;
	
	var addOption = mxUtils.bind(this, function(label, key, defaultValue, fn)
	{
		var opt = this.createCellOption(label, key, defaultValue, null, null, fn);
		opt.style.alignItems = 'top';
		current.appendChild(opt);
		current = (current == left) ? right : left;

		return opt;
	});

	var listener = mxUtils.bind(this, function(sender, evt, force)
	{
		ss = ui.getSelectionState();
		
		left.innerText = '';
		right.innerText = '';
		current = left;
		
		if (ss.rounded)
		{
			addOption(mxResources.get('rounded'), mxConstants.STYLE_ROUNDED, 0);
		}
		
		if (ss.swimlane)
		{
			addOption(mxResources.get('divider'), 'swimlaneLine', 1);
		}
		
		addOption(mxResources.get('sketch'), 'sketch', 0, function(cells, enabled)
		{
			graph.updateCellStyles({'sketch': (enabled) ? '1' : null,
				'curveFitting': (enabled) ? Editor.sketchDefaultCurveFitting : null,
				'jiggle': (enabled) ? Editor.sketchDefaultJiggle : null}, cells);
		});

		if (ss.glass)
		{
			addOption(mxResources.get('glass'), mxConstants.STYLE_GLASS, 0);
		}
		
		var option = addOption(mxResources.get('shadow'), mxConstants.STYLE_SHADOW, 0);

		if (!Editor.enableShadowOption)
		{
			option.getElementsByTagName('input')[0].setAttribute('disabled', 'disabled');
			mxUtils.setOpacity(option, 60);
		}

		if (ss.edges.length > 0 && ss.vertices.length == 0)
		{
			addOption(mxResources.get('flowAnimation', null, 'Flow Animation'), 'flowAnimation', 0);
		}
		
		// Adds primary custom shape options
		if (ss.customProperties != null)
		{
			for (var key in ss.customProperties)
			{
				var prop = ss.customProperties[key];

				if (prop != null && prop.type == 'bool' && prop.primary &&
					(typeof(prop.isVisible) !== 'function' ||
					prop.isVisible(ss, this)))
				{
					addOption(prop.dispName, key, prop.defVal ? '1' : '0');
				}
			}
		}
	});
	
	graph.getModel().addListener(mxEvent.CHANGE, listener);
	this.listeners.push({destroy: function() { graph.getModel().removeListener(listener); }});
	listener();

	return div;
}

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel.prototype.addStyleOps = function(div)
{
	var ss = this.editorUi.getSelectionState();

	if (ss.cells.length == 1)
	{
		this.addActions(div, ['setAsDefaultStyle']);
	}

	return div;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramStylePanel = function(format, editorUi, container)
{
	BaseFormatPanel.call(this, format, editorUi, container);
	this.init();
};

mxUtils.extend(DiagramStylePanel, BaseFormatPanel);

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramStylePanel.prototype.init = function()
{
	this.container.appendChild(this.addView(this.createPanel()));
};

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramStylePanel.prototype.getGlobalStyleButtons = function()
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;

	var sketchDiv = document.createElement('div');
	sketchDiv.className = 'geFormatEntry';

	var sketchInput = document.createElement('input');
	sketchInput.setAttribute('type', 'checkbox');
	sketchInput.setAttribute('title', mxResources.get('sketch'));
	sketchInput.checked = Editor.sketchMode;
	sketchDiv.appendChild(sketchInput);
	mxUtils.write(sketchDiv, mxResources.get('sketch'));
	sketchDiv.setAttribute('title', mxResources.get('sketch'));

	mxEvent.addListener(sketchDiv, 'click', function(evt)
	{
		if (graph.isEnabled())
		{
			var value = !Editor.sketchMode;
			
			graph.updateCellStyles({'sketch': (value) ? '1' : null,
				'curveFitting': (value) ? Editor.sketchDefaultCurveFitting : null,
				'jiggle': (value) ? Editor.sketchDefaultJiggle : null},
				graph.getVerticesAndEdges());
			ui.setSketchMode(value);
			mxEvent.consume(evt);
		}
	});

	var buttons = [sketchDiv, mxUtils.button(mxResources.get('rounded'),
		mxUtils.bind(this, function(evt)
		{
			// Checks if all cells are rounded
			var cells = graph.getVerticesAndEdges();
			var rounded = true;

			if (cells.length > 0)
			{
				for (var i = 0; i < cells.length; i++)
				{
					var style = graph.getCellStyle(cells[i]);

					if (mxUtils.getValue(style, mxConstants.STYLE_ROUNDED, 0) == 0)
					{
						rounded = false;
						break;
					}
				}
			}
			
			rounded = !rounded;
			graph.updateCellStyles({'rounded': (rounded) ? '1' : '0'}, cells);

			if (rounded)
			{
				graph.currentEdgeStyle['rounded'] = '1';
				graph.currentVertexStyle['rounded'] = '1';
			}
			else
			{
				delete graph.currentEdgeStyle['rounded'];
				delete graph.currentVertexStyle['rounded'];
			}

			mxEvent.consume(evt);
		}
	))];

	if (!graph.isEnabled())
	{
		for (var i = 0; i < buttons.length; i++)
		{
			if (buttons[i].nodeName == 'BUTTON')
			{
				buttons[i].setAttribute('disabled', 'disabled');
			}
			else
			{
				var inp = buttons[i].getElementsByTagName('input');

				if (inp.length > 0)
				{
					inp[0].setAttribute('disabled', 'disabled');
				}
			}
		}
	}

	return buttons;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramStylePanel.prototype.addView = function(div)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	
	var opts = document.createElement('div');
	opts.className = 'geFormatEntry';
	
	// Adaptive Colors
	if (graph.isEnabled())
	{
		var table = document.createElement('table');
		table.style.tableLayout = 'fixed';
		table.style.width = '204px';
		
		var tbody = document.createElement('tbody');
		var row = document.createElement('tr');
		var left = document.createElement('td');
		var right = left.cloneNode(true);

		var label = document.createElement('div');
		label.style.display = 'inline-block';
		label.style.boxSizing = 'border-box';
		label.style.overflow = 'hidden';
		label.style.textOverflow = 'ellipsis';

		var title = mxResources.get('adaptiveColors');
		left.setAttribute('title', title);
		mxUtils.write(label, title);
		left.appendChild(label);

		if (mxUtils.lightDarkColorSupported)
		{
			label.style.width = '75%';
			var img = document.createElement('img');
			img.setAttribute('title', mxResources.get('light') +
				'/' + mxResources.get('dark'));
			img.setAttribute('src', Editor.contrastImage);
			img.className = 'geButton';
			img.style.width = '18px';
			img.style.height = '18px';
			img.style.verticalAlign = 'bottom';
			left.appendChild(img);

			// Pressing label toggles dark/light mode
			mxEvent.addListener(img, 'click', function()
			{
				if (graph.isEnabled())
				{
					ui.setDarkMode(!Editor.isDarkMode());
				}
			});
		}
		else
		{
			label.style.width = '100%';
		}

		var dropdown = document.createElement('select');
		dropdown.style.width = '82px';

		var opt = document.createElement('option');
		opt.setAttribute('title', mxResources.get('default') + ' (' +
			mxResources.get(Graph.getDefaultAdaptiveColorsKey()) + ')');
		mxUtils.write(opt, mxUtils.htmlEntities(opt.getAttribute('title')));
		opt.setAttribute('value', 'default');
		dropdown.appendChild(opt);

		var opt = document.createElement('option');
		opt.setAttribute('title', mxResources.get('automatic'));
		mxUtils.write(opt, mxUtils.htmlEntities(opt.getAttribute('title')));
		opt.setAttribute('value', 'auto');
		dropdown.appendChild(opt);

		var opt = document.createElement('option');
		opt.setAttribute('title', mxResources.get('simple'));
		mxUtils.write(opt, mxUtils.htmlEntities(opt.getAttribute('title')));
		opt.setAttribute('value', 'simple');
		dropdown.appendChild(opt);

		var opt = document.createElement('option');
		opt.setAttribute('title', mxResources.get('none'));
		mxUtils.write(opt, mxUtils.htmlEntities(opt.getAttribute('title')));
		opt.setAttribute('value', 'none');
		dropdown.appendChild(opt);

		dropdown.value = (graph.adaptiveColors == null) ?
			'default' : graph.adaptiveColors;

		mxEvent.addListener(dropdown, 'change', function()
		{
			var change = new ChangePageSetup(ui);
			change.ignoreColor = true;
			change.ignoreImage = true;
			change.adaptiveColors = dropdown.value;
			
			graph.model.execute(change);
		});
		
		right.appendChild(dropdown);

		if (!ui.isOffline() || mxClient.IS_CHROMEAPP || EditorUi.isElectronApp)
		{
			right.appendChild(ui.menus.createHelpLink(
				'https://github.com/jgraph/drawio/discussions/4713'));
		}

		row.appendChild(left);
		row.appendChild(right);
		tbody.appendChild(row);

		var buttons = this.getGlobalStyleButtons();
	
		for (var i = 0; i < buttons.length; i += 2)
		{
			left = left.cloneNode(false);
			right = right.cloneNode(false);
			row = row.cloneNode(false);
	
			var btn = buttons[i];
			btn.style.width = '100%';
	
			left.appendChild(btn);
			row.appendChild(left);
	
			btn = buttons[i + 1];
	
			if (btn != null)
			{
				btn.style.width = '100%';
				right.appendChild(btn);
			}
	
			row.appendChild(right);
			tbody.appendChild(row);
		}
	
		table.appendChild(tbody);
		opts.appendChild(table);
		div.appendChild(opts);
	
		if (graph.isEnabled() && Editor.styles != null)
		{
			this.addGraphStyles(div);
		}
	}

	return div;
};


/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramStylePanel.prototype.addGraphStyles = function(div)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	var model = graph.getModel();
	var gridColor = graph.view.gridColor;
	var defaultStyles = ['fillColor', 'strokeColor', 'fontColor', 'gradientColor'];
	div.style.whiteSpace = 'normal';
	
	var updateCells = mxUtils.bind(this, function(styles, graphStyle)
	{
		var cells = graph.getVerticesAndEdges();
		
		model.beginUpdate();
		try
		{
			for (var i = 0; i < cells.length; i++)
			{
				var style = graph.getCellStyle(cells[i]);
				
				// Handles special label background color
				if (!ignoreGraphStyle && style['labelBackgroundColor'] != null)
				{
					graph.updateCellStyles({'labelBackgroundColor': (graphStyle != null) ?
						graphStyle.background : null}, [cells[i]]);
				}
				else if (ignoreGraphStyle)
				{
					graph.updateCellStyles({'labelBackgroundColor': mxConstants.NONE}, [cells[i]]);
				}
				
				var edge = model.isEdge(cells[i]);
				var newStyle = model.getStyle(cells[i]);
				var current = (edge) ? graph.currentEdgeStyle : graph.currentVertexStyle;

				for (var j = 0; j < styles.length; j++)
				{
					if ((style[styles[j]] != null && style[styles[j]] != mxConstants.NONE) ||
						(styles[j] != mxConstants.STYLE_FILLCOLOR &&
						styles[j] != mxConstants.STYLE_STROKECOLOR))
					{
						if (ignoreGraphStyle && edge && styles[j] == mxConstants.STYLE_FONTCOLOR)
						{
							newStyle = mxUtils.setStyle(newStyle, styles[j], 'default');
						}
						else
						{
							newStyle = mxUtils.setStyle(newStyle, styles[j], current[styles[j]]);
						}
					}
				}
				
				model.setStyle(cells[i], newStyle);
			}
		}
		finally
		{
			model.endUpdate();
		}
	});
			
	var removeStyles = mxUtils.bind(this, function(style, styles, defaultStyle)
	{
		if (style != null)
		{
			for (var j = 0; j < styles.length; j++)
			{
				if (((style[styles[j]] != null &&
					style[styles[j]] != mxConstants.NONE) ||
					(styles[j] != mxConstants.STYLE_FILLCOLOR &&
					styles[j] != mxConstants.STYLE_STROKECOLOR)))
				{
					style[styles[j]] = defaultStyle[styles[j]];
				}
			}
		}
	});

	var ignoreGraphStyle = true;

	var applyStyle = mxUtils.bind(this, function(style, result, cell, graphStyle, theGraph)
	{
		if (style != null)
		{
			if (cell != null)
			{
				// Handles special label background color
				if (!ignoreGraphStyle && result['labelBackgroundColor'] != null)
				{
					var bg = (graphStyle != null) ? graphStyle.background : null;
					theGraph = (theGraph != null) ? theGraph : graph;
					
					if (bg == null)
					{
						bg = theGraph.background;
					}
					
					if (bg == null)
					{
						bg = theGraph.defaultPageBackgroundColor;
					}
					
					result['labelBackgroundColor'] = bg;
				}
				else if (ignoreGraphStyle)
				{
					result['labelBackgroundColor'] = mxConstants.NONE;
				}
			}
			
			for (var key in style)
			{
				if (cell == null || ((result[key] != null &&
					result[key] != mxConstants.NONE) ||
					(key != mxConstants.STYLE_FILLCOLOR &&
					key != mxConstants.STYLE_STROKECOLOR)))
				{
					if (ignoreGraphStyle && model.isEdge(cell) &&
						key == mxConstants.STYLE_FONTCOLOR)
					{
						result[key] = 'default';
					}
					else
					{
						result[key] = style[key];
					}
				}
			}
		}
	});

	var createPreview = mxUtils.bind(this, function(commonStyle, vertexStyle, edgeStyle, graphStyle, container)
	{
		// Wrapper needed to catch events
		var div = document.createElement('div');
		div.style.position = 'relative';
		div.style.pointerEvents = 'none';
		div.style.width = '60px';
		div.style.height = '60px';
		container.appendChild(div);
		
		var graph2 = new Graph(div, null, null, graph.getStylesheet());
		graph2.shapeForegroundColor = 'light-dark(#000000, #c0c0c0)';
		graph2.shapeBackgroundColor = 'light-dark(var(--ge-panel-color), var(--ge-dark-panel-color))';
		graph2.resetViewOnRootChange = false;
		graph2.foldingEnabled = false;
		graph2.gridEnabled = false;
		graph2.autoScroll = false;
		graph2.setTooltips(false);
		graph2.setConnectable(false);
		graph2.setPanning(false);
		graph2.setEnabled(false);

		graph2.getCellStyle = function(cell, resolve)
		{
			resolve = (resolve != null) ? resolve : true;
			var result = mxUtils.clone(graph.getCellStyle.apply(this, arguments));
			var defaultStyle = graph.stylesheet.getDefaultVertexStyle();
			var appliedStyle = vertexStyle;
			
			if (model.isEdge(cell))
			{
				defaultStyle = graph.stylesheet.getDefaultEdgeStyle();
				appliedStyle = edgeStyle;	
			}
			
			removeStyles(result, defaultStyles, defaultStyle);
			applyStyle(commonStyle, result, cell, graphStyle, graph2);
			applyStyle(appliedStyle, result, cell, graphStyle, graph2);
			
			if (resolve)
			{
				result = graph.postProcessCellStyle(cell, result);
			}

			return result;
		};
		
		// Avoid HTML labels to capture events in bubble phase
		graph2.model.beginUpdate();
		try
		{
			var v1 = graph2.insertVertex(graph2.getDefaultParent(), null, 'Shape', 2, 2, 56, 30, 'strokeWidth=2;');
			var e1 = graph2.insertEdge(graph2.getDefaultParent(), null, 'Connector', v1, v1,
				'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;endSize=3;strokeWidth=2;')
			e1.geometry.points = [new mxPoint(28, 46)];
			e1.geometry.offset = new mxPoint(0, 8);
		}
		finally
		{
			graph2.model.endUpdate();
		}

		// Adds dark and light mode preview
		var root = graph2.view.getDrawPane().ownerSVGElement;
			
		if (root != null)
		{
			var clone = root.cloneNode(true);
			clone.style.position = 'absolute';
			clone.style.clipPath = 'rect(0 52% 100% 0)';
			root.style.clipPath = 'rect(0 100% 100% 51%)';
			root.style.colorScheme = 'light';
			root.parentNode.appendChild(clone);
		}
	});
	
	// Entries
	var entries = document.createElement('div');
	entries.style.whiteSpace = 'normal';
	div.appendChild(entries);
	
	// Cached entries
	if (this.format.cachedStyleEntries == null)
	{
		this.format.cachedStyleEntries = [];
	}

	function addKeys(style, result)
	{
		for (var key in style)
		{
			result.push(key);
		}

		return result;
	};

	var addEntry = mxUtils.bind(this, function(commonStyle, vertexStyle, edgeStyle, graphStyle, index)
	{
		var panel = this.format.cachedStyleEntries[index];
		
		if (panel == null)
		{
			panel = document.createElement('div');
			panel.className = 'geGraphStylePreview';
	
			if (!ignoreGraphStyle && graphStyle != null && graphStyle.background != null)
			{
				panel.style.backgroundColor = graphStyle.background;
			}
			
			createPreview(commonStyle, vertexStyle, edgeStyle, graphStyle, panel); 
			
			mxEvent.addGestureListeners(panel, mxUtils.bind(this, function(evt)
			{
				panel.style.opacity = 0.6;
			}), null, mxUtils.bind(this, function(evt)
			{
				panel.style.opacity = '';
				graph.currentVertexStyle = mxUtils.clone(graph.defaultVertexStyle);
				graph.currentEdgeStyle = mxUtils.clone(graph.defaultEdgeStyle);
				
				applyStyle(commonStyle, graph.currentVertexStyle);
				applyStyle(commonStyle, graph.currentEdgeStyle);
				applyStyle(vertexStyle, graph.currentVertexStyle);
				applyStyle(edgeStyle, graph.currentEdgeStyle);

				model.beginUpdate();
				try
				{
					updateCells(addKeys(commonStyle, defaultStyles.slice()), graphStyle);
					
					if (!ignoreGraphStyle)
					{
						var change = new ChangePageSetup(ui, (graphStyle != null) ? graphStyle.background : null);
						change.ignoreImage = true;
						model.execute(change);
							
						model.execute(new ChangeGridColor(ui,
							(graphStyle != null && graphStyle.gridColor != null) ?
							graphStyle.gridColor : gridColor));
					}
				}
				finally
				{
					model.endUpdate();
				}
			}));
			
			if (!mxClient.IS_TOUCH)
			{
				mxEvent.addListener(panel, 'mouseenter', mxUtils.bind(this, function(evt)
				{
					var prev = graph.getCellStyle;
					var prevBg = graph.background;
					var prevGrid = graph.view.gridColor;
		
					if (!ignoreGraphStyle)
					{
						graph.background = (graphStyle != null) ? graphStyle.background : null;
						graph.view.gridColor = (graphStyle != null && graphStyle.gridColor != null) ?
							graphStyle.gridColor : gridColor;
					}
					
					graph.getCellStyle = function(cell, resolve)
					{
						resolve = (resolve != null) ? resolve : true;
						var result = mxUtils.clone(prev.apply(this, arguments));
						
						var defaultStyle = graph.stylesheet.getDefaultVertexStyle();
						var appliedStyle = vertexStyle;
						
						if (model.isEdge(cell))
						{
							defaultStyle = graph.stylesheet.getDefaultEdgeStyle();
							appliedStyle = edgeStyle;	
						}
						
						removeStyles(result, defaultStyles, defaultStyle);
						applyStyle(commonStyle, result, cell, graphStyle);
						applyStyle(appliedStyle, result, cell, graphStyle);
						
						if (resolve)
						{
							result = this.postProcessCellStyle(cell, result);
						}
						
						return result;
					};
					
					graph.refresh();
					graph.getCellStyle = prev;
					graph.background = prevBg;
					graph.view.gridColor = prevGrid;
				}));
				
				mxEvent.addListener(panel, 'mouseleave', mxUtils.bind(this, function(evt)
				{
					graph.refresh();
				}));
			}
			
			this.format.cachedStyleEntries[index] = panel;
		}
		
		entries.appendChild(panel);
	});
		
	// Maximum palettes to switch the switcher
	var maxEntries = 10;
	var pageCount = Math.ceil(Editor.styles.length / maxEntries);
	this.format.currentStylePage = (this.format.currentStylePage != null) ? this.format.currentStylePage : 0;
	var dots = [];
	
	var addEntries = mxUtils.bind(this, function()
	{
		if (dots.length > 0)
		{
			dots[this.format.currentStylePage].style.background = '#84d7ff';
		}
		
		for (var i = this.format.currentStylePage * maxEntries;
			i < Math.min((this.format.currentStylePage + 1) * maxEntries,
			Editor.styles.length); i++)
		{
			var s = Editor.styles[i];
			addEntry(s.commonStyle, s.vertexStyle, s.edgeStyle, s.graph, i);
		}
	});
	
	var selectPage = mxUtils.bind(this, function(index)
	{
		if (index >= 0 && index < pageCount)
		{
			dots[this.format.currentStylePage].style.background = 'transparent';
			entries.innerText = '';
			this.format.currentStylePage = index;
			addEntries();
		}
	});
	
	if (pageCount > 1)
	{
		// Selector
		var switcher = document.createElement('div');
		switcher.className = 'geSwitcher';
		switcher.style.width = '200px';
		
		for (var i = 0; i < pageCount; i++)
		{
			var dot = document.createElement('div');
			dot.className = 'geSwitcherDot';
			
			(mxUtils.bind(this, function(index, elt)
			{
				mxEvent.addListener(dot, 'click', mxUtils.bind(this, function()
				{
					selectPage(index);
				}));
			}))(i, dot);
			
			switcher.appendChild(dot);
			dots.push(dot);
		}
		
		div.appendChild(switcher);
		addEntries();
		
		if (pageCount < 15 && dots.length > 0)
		{
			var left = document.createElement('div');
			left.className = 'geButton';
			left.style.backgroundImage = 'url(' + Editor.chevronLeftImage + ')';
			
			var right = left.cloneNode(false);
			right.style.backgroundImage = 'url(' + Editor.chevronRightImage + ')';

			switcher.insertBefore(left, dots[0]);
			switcher.appendChild(right);
			
			mxEvent.addListener(left, 'click', mxUtils.bind(this, function()
			{
				selectPage(mxUtils.mod(this.format.currentStylePage - 1, pageCount));
			}));
			
			mxEvent.addListener(right, 'click', mxUtils.bind(this, function()
			{
				selectPage(mxUtils.mod(this.format.currentStylePage + 1, pageCount));
			}));
		}
	}
	else
	{
		addEntries();
	}

	return div;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramFormatPanel = function(format, editorUi, container)
{
	BaseFormatPanel.call(this, format, editorUi, container);
	this.init();
};

mxUtils.extend(DiagramFormatPanel, BaseFormatPanel);

/**
 * Switch to disable page view.
 */
DiagramFormatPanel.showPageView = true;

/**
 * Specifies if the background image option should be shown. Default is true.
 */
DiagramFormatPanel.prototype.showBackgroundImageOption = true;

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramFormatPanel.prototype.init = function()
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;

	this.container.appendChild(this.addView(this.createPanel()));

	if (graph.isEnabled())
	{
		var optSec = this.createCollapsibleSection(mxResources.get('options'), false);
		optSec.contentDiv.appendChild(this.addOptions(this.createPanel()));
		this.container.appendChild(optSec.wrapper);

		var paperSec = this.createCollapsibleSection(mxResources.get('paperSize'), true);
		paperSec.contentDiv.appendChild(this.addPaperSize(this.createPanel()));
		this.container.appendChild(paperSec.wrapper);

		this.container.appendChild(this.addStyleOps(this.createPanel()));
	}
};

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramFormatPanel.prototype.addView = function(div)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	
	div.appendChild(this.createTitle(mxResources.get('view')));
	
	// Grid
	this.addGridOption(div);
	
	// Page View
	if (DiagramFormatPanel.showPageView)
	{
		div.appendChild(this.createOption(mxResources.get('pageView'), function()
		{
			return graph.pageVisible;
		}, function(checked)
		{
			ui.actions.get('pageView').funct();
		},
		{
			install: function(apply)
			{
				this.listener = function()
				{
					apply(graph.pageVisible);
				};
				
				ui.addListener('pageViewChanged', this.listener);
			},
			destroy: function()
			{
				ui.removeListener(this.listener);
			}
		}));
	}
	
	if (graph.isEnabled())
	{
		if (this.showBackgroundImageOption)
		{
			var bg = this.createOption(mxResources.get('background'), function()
			{
				return graph.backgroundImage != null;
			}, function(checked)
			{
				if (!checked)
				{
					var change = new ChangePageSetup(ui, null, null);
					change.ignoreColor = true;

					graph.model.execute(change);
				}
			},
			{
				install: function(apply)
				{
					this.listener = function()
					{
						apply(graph.backgroundImage != null);
					};
					
					ui.addListener('backgroundImageChanged', this.listener);
				},
				destroy: function()
				{
					ui.removeListener(this.listener);
				}
			});

			var input = bg.getElementsByTagName('input')[0];

			if (input != null)
			{
				input.style.visibility = graph.backgroundImage != null ? 'visible' : 'hidden';
			}
			
			var label = bg.getElementsByTagName('span')[0];
			
			if (label != null)
			{
				label.style.maxWidth = '80px';
			}

			var btn = mxUtils.button(mxResources.get('change') + '...', function(evt)
			{
				ui.showBackgroundImageDialog(null,
					ui.editor.graph.backgroundImage,
					ui.editor.graph.background);
				mxEvent.consume(evt);
			})
			
			btn.style.position = 'absolute';
			btn.style.height = '22px';
			btn.style.left = '102px';
			btn.style.width = '110px';
			btn.style.maxWidth = btn.style.width;
			
			bg.appendChild(btn);
			div.appendChild(bg);
		}

		var bgColor = this.createColorOption(mxResources.get('backgroundColor'), function()
		{
			return graph.background;
		}, function(color)
		{
			var change = new ChangePageSetup(ui, color);
			change.ignoreImage = true;

			graph.model.execute(change);
		}, '#ffffff');

		div.appendChild(bgColor);

		var option = this.createOption(mxResources.get('shadow'), function()
		{
			return graph.shadowVisible;
		}, function(checked)
		{
			var change = new ChangePageSetup(ui);
			change.ignoreColor = true;
			change.ignoreImage = true;
			change.shadowVisible = checked;
			
			graph.model.execute(change);
		},
		{
			install: function(apply)
			{
				this.listener = function()
				{
					apply(graph.shadowVisible);
				};
				
				ui.addListener('shadowVisibleChanged', this.listener);
			},
			destroy: function()
			{
				ui.removeListener(this.listener);
			}
		});
		
		if (!Editor.enableShadowOption)
		{
			option.getElementsByTagName('input')[0].setAttribute('disabled', 'disabled');
			mxUtils.setOpacity(option, 60);
		}

		div.appendChild(option);
	}
	
	return div;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramFormatPanel.prototype.addOptions = function(div)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	
	if (graph.isEnabled())
	{
		// Connection arrows
		div.appendChild(this.createOption(mxResources.get('connectionArrows'), function()
		{
			return graph.connectionArrowsEnabled;
		}, function(checked)
		{
			ui.actions.get('connectionArrows').funct();
		},
		{
			install: function(apply)
			{
				this.listener = function()
				{
					apply(graph.connectionArrowsEnabled);
				};
				
				ui.addListener('connectionArrowsChanged', this.listener);
			},
			destroy: function()
			{
				ui.removeListener(this.listener);
			}
		}));
		
		// Connection points
		div.appendChild(this.createOption(mxResources.get('connectionPoints'), function()
		{
			return graph.connectionHandler.isEnabled();
		}, function(checked)
		{
			ui.actions.get('connectionPoints').funct();
		},
		{
			install: function(apply)
			{
				this.listener = function()
				{
					apply(graph.connectionHandler.isEnabled());
				};
				
				ui.addListener('connectionPointsChanged', this.listener);
			},
			destroy: function()
			{
				ui.removeListener(this.listener);
			}
		}));

		// Guides
		div.appendChild(this.createOption(mxResources.get('guides'), function()
		{
			return graph.graphHandler.guidesEnabled;
		}, function(checked)
		{
			ui.actions.get('guides').funct();
		},
		{
			install: function(apply)
			{
				this.listener = function()
				{
					apply(graph.graphHandler.guidesEnabled);
				};
				
				ui.addListener('guidesEnabledChanged', this.listener);
			},
			destroy: function()
			{
				ui.removeListener(this.listener);
			}
		}));
	}

	return div;
};

/**
 * 
 */
DiagramFormatPanel.prototype.addGridOption = function(container)
{
	var fPanel = this;
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	
	var input = document.createElement('input');
	input.style.position = 'absolute';
	input.style.width = '50px';
	input.setAttribute('title', mxResources.get('gridSize'));
	input.value = this.inUnit(graph.getGridSize()) + ' ' + this.getUnit();

	var stepper = this.createStepper(input, update, this.getUnitStep(), null, null, this.isFloatUnit());
	input.style.display = (graph.isGridEnabled()) ? '' : 'none';
	stepper.style.display = input.style.display;

	mxEvent.addListener(input, 'keydown', function(e)
	{
		if (e.keyCode == 13)
		{
			graph.container.focus();
			mxEvent.consume(e);
		}
		else if (e.keyCode == 27)
		{
			input.value = graph.getGridSize();
			graph.container.focus();
			mxEvent.consume(e);
		}
	});
	
	function update(evt)
	{
		var value = fPanel.isFloatUnit()? parseFloat(input.value) : parseInt(input.value);
		value = fPanel.fromUnit(Math.max(fPanel.inUnit(1), (isNaN(value)) ? fPanel.inUnit(10) : value));
		
		if (value != graph.getGridSize())
		{
			mxGraph.prototype.gridSize = value;
			graph.setGridSize(value)
		}

		input.value = fPanel.inUnit(value) + ' ' + fPanel.getUnit();
		mxEvent.consume(evt);
	};

	mxEvent.addListener(input, 'blur', update);
	mxEvent.addListener(input, 'change', update);

	input.style.left = '100px';
	stepper.style.left = '150px';

	// Grid dark mode must take into account adaptive colors state
	var isDarkModeFn = function()
	{
		return graph.getAdaptiveColors() != 'none' &&
			Editor.isDarkMode();
	};

	var defaultGridColor = 'light-dark(' +
		mxGraphView.prototype.defaultGridColor + ',' +
			mxGraphView.prototype.defaultDarkGridColor + ')';

	var panel = this.createColorOption(mxResources.get('grid'), function()
	{
		return (graph.isGridEnabled()) ? graph.view.gridColor : null;
	}, function(color)
	{
		var enabled = graph.isGridEnabled();
		
		if (color == mxConstants.NONE)
		{
			graph.setGridEnabled(false);
		}
		else
		{
			graph.setGridEnabled(true);
			ui.setGridColor(color, isDarkModeFn());
		}
		
		input.style.display = (graph.isGridEnabled()) ? '' : 'none';
		stepper.style.display = input.style.display;
		
		if (enabled != graph.isGridEnabled())
		{
			graph.defaultGridEnabled = graph.isGridEnabled();
			ui.fireEvent(new mxEventObject('gridEnabledChanged'));
		}
	}, graph.view.gridColor,
	{
		install: function(apply)
		{
			this.listener = function()
			{
				apply((graph.isGridEnabled()) ?
					graph.view.gridColor :
					mxConstants.NONE);
			};
			
			ui.addListener('darkModeChanged', this.listener);
			ui.addListener('gridColorChanged', this.listener);
			ui.addListener('gridEnabledChanged', this.listener);
		},
		destroy: function()
		{
			ui.removeListener(this.listener);
		}
	}, null, null, defaultGridColor, true, isDarkModeFn);

	panel.appendChild(input);
	panel.appendChild(stepper);
	container.appendChild(panel);
};

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramFormatPanel.prototype.addDocumentProperties = function(div)
{
	div.appendChild(this.createTitle(mxResources.get('options')));

	return div;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramFormatPanel.prototype.addPaperSize = function(div)
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	
	var accessor = PageSetupDialog.addPageFormatPanel(div, 'formatpanel', graph.pageFormat, function(pageFormat)
	{
		if (graph.pageFormat == null || graph.pageFormat.width != pageFormat.width ||
			graph.pageFormat.height != pageFormat.height)
		{
			var change = new ChangePageSetup(ui, null, null, pageFormat);
			change.ignoreColor = true;
			change.ignoreImage = true;
			
			graph.model.execute(change);
		}
	});
	
	this.addKeyHandler(accessor.widthInput, function()
	{
		accessor.set(graph.pageFormat);
	});

	this.addKeyHandler(accessor.heightInput, function()
	{
		accessor.set(graph.pageFormat);	
	});
	
	var listener = function()
	{
		accessor.set(graph.pageFormat);
	};
	
	ui.addListener('pageFormatChanged', listener);
	this.listeners.push({destroy: function() { ui.removeListener(listener); }});
	
	graph.getModel().addListener(mxEvent.CHANGE, listener);
	this.listeners.push({destroy: function() { graph.getModel().removeListener(listener); }});
	
	return div;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramFormatPanel.prototype.addStyleOps = function(div)
{
	this.addActions(div, ['editData']);
	this.addActions(div, ['clearDefaultStyle']);

	return div;
};

/**
 * Function design panel that reuses the native format sidebar.
 */
FunctionDesignFormatPanel = function(format, editorUi, container)
{
	BaseFormatPanel.call(this, format, editorUi, container);
	this.init();
};

mxUtils.extend(FunctionDesignFormatPanel, BaseFormatPanel);

/**
 * Returns the attribute value for the selected cell.
 */
FunctionDesignFormatPanel.prototype.getCellAttribute = function(cell, key)
{
	return (cell != null) ? this.editorUi.editor.graph.getAttributeForCell(cell, key, '') : '';
};

/**
 * Persists function design data onto the selected graph cell.
 */
FunctionDesignFormatPanel.prototype.applyCellAttributes = function(cell, values)
{
	var graph = this.editorUi.editor.graph;

	if (cell == null)
	{
		return;
	}

	graph.getModel().beginUpdate();

	try
	{
		for (var key in values)
		{
			if (values.hasOwnProperty(key))
			{
				var value = values[key];
				graph.setAttributeForCell(cell, key, (value != null && value !== '') ? value : null);
			}
		}
	}
	finally
	{
		graph.getModel().endUpdate();
	}

	if (this.editorUi.notifyFunctionFlowGraphChange != null)
	{
		this.editorUi.notifyFunctionFlowGraphChange();
	}
};

/**
 * Builds one input row for the function design panel.
 */
FunctionDesignFormatPanel.prototype.createSection = function(titleText, subtitleText)
{
	var section = document.createElement('div');
	section.className = 'geFunctionSection';

	var header = document.createElement('div');
	header.className = 'geFunctionSectionHeader';

	var heading = document.createElement('div');
	heading.className = 'geFunctionSectionHeading';

	var title = document.createElement('div');
	title.className = 'geFunctionSectionTitle';
	mxUtils.write(title, titleText);
	heading.appendChild(title);

	if (subtitleText != null && subtitleText.length > 0)
	{
		var subtitle = document.createElement('div');
		subtitle.className = 'geFunctionSectionSubtitle';
		mxUtils.write(subtitle, subtitleText);
		heading.appendChild(subtitle);
	}

	header.appendChild(heading);
	section.appendChild(header);

	var body = document.createElement('div');
	body.className = 'geFunctionSectionBody';
	section.appendChild(body);

	return {
		body: body,
		header: header,
		section: section
	};
};

/**
 * Builds a field shell that matches the research record sidebar.
 */
FunctionDesignFormatPanel.prototype.createFieldShell = function(parent, labelText, hintText)
{
	var field = document.createElement('label');
	field.className = 'geFunctionField';

	var top = document.createElement('div');
	top.className = 'geFunctionFieldTop';

	var label = document.createElement('div');
	label.className = 'geFunctionFieldLabel';
	mxUtils.write(label, labelText);
	top.appendChild(label);

	if (hintText != null && hintText.length > 0)
	{
		var hint = document.createElement('div');
		hint.className = 'geFunctionFieldHint';
		mxUtils.write(hint, hintText);
		top.appendChild(hint);
	}

	field.appendChild(top);
	parent.appendChild(field);

	return field;
};

/**
 * Builds one input row for the function design panel.
 */
FunctionDesignFormatPanel.prototype.addField = function(parent, labelText, value, saveFn, placeholder, multiline, hintText)
{
	var section = this.createFieldShell(parent, labelText, hintText || '');

	var input = multiline ? document.createElement('textarea') : document.createElement('input');
	input.setAttribute('spellcheck', 'false');
	input.setAttribute('placeholder', placeholder || '');
	input.value = value || '';

	if (multiline)
	{
		input.className = 'geFunctionTextarea';
		input.setAttribute('rows', '4');
	}
	else
	{
		input.className = 'geFunctionInput';
		input.setAttribute('type', 'text');
	}

	mxEvent.addListener(input, 'change', function()
	{
		saveFn(mxUtils.trim(input.value));
	});

	section.appendChild(input);

	return input;
};

FunctionDesignFormatPanel.prototype.addReadonlyBlock = function(parent, labelText, value)
{
	var section = this.createFieldShell(parent, labelText, '');
	var block = document.createElement('div');
	block.className = 'geFunctionReadBlock';
	mxUtils.write(block, value || '-');
	section.appendChild(block);
	return block;
};

FunctionDesignFormatPanel.prototype.addJsonField = function(parent, labelText, value, saveFn, placeholder)
{
	return this.addField(parent, labelText, value, mxUtils.bind(this, function(nextValue)
	{
		try
		{
			var parsed = (nextValue == null || mxUtils.trim(nextValue) === '') ? [] : JSON.parse(nextValue);
			saveFn(parsed);
		}
		catch (e)
		{
			mxUtils.alert('JSON 格式不正确');
		}
	}), placeholder, true, null);
};

FunctionDesignFormatPanel.prototype.addSelectField = function(parent, labelText, value, saveFn, options)
{
	var section = this.createFieldShell(parent, labelText, '');
	var select = document.createElement('select');
	select.className = 'geFunctionInput';

	for (var i = 0; i < options.length; i++)
	{
		var option = document.createElement('option');
		option.value = options[i].value;
		mxUtils.write(option, options[i].label);
		if ((value || '') === options[i].value)
		{
			option.selected = true;
		}
		select.appendChild(option);
	}

	mxEvent.addListener(select, 'change', function()
	{
		saveFn(select.value);
	});

	section.appendChild(select);
	return select;
};

FunctionDesignFormatPanel.prototype.addComboField = function(parent, labelText, value, saveFn, options, placeholder, hintText)
{
	var section = this.createFieldShell(parent, labelText, hintText || '');
	var input = document.createElement('input');
	input.className = 'geFunctionInput';
	input.setAttribute('type', 'text');
	input.setAttribute('spellcheck', 'false');
	input.setAttribute('placeholder', placeholder || '');
	input.value = value || '';

	var dataListId = 'geFunctionDatalist_' + ((this.editorUi.functionFlowInputSeq = (this.editorUi.functionFlowInputSeq || 0) + 1));
	var dataList = document.createElement('datalist');
	dataList.setAttribute('id', dataListId);

	options = options || [];
	for (var i = 0; i < options.length; i++)
	{
		var option = document.createElement('option');
		option.value = options[i].value;
		if (options[i].label != null)
		{
			option.label = options[i].label;
		}
		dataList.appendChild(option);
	}

	input.setAttribute('list', dataListId);
	mxEvent.addListener(input, 'change', function()
	{
		saveFn(mxUtils.trim(input.value));
	});
	mxEvent.addListener(input, 'blur', function()
	{
		saveFn(mxUtils.trim(input.value));
	});

	section.appendChild(input);
	section.appendChild(dataList);
	return input;
};

FunctionDesignFormatPanel.prototype.createActionButton = function(labelText, variant, clickHandler)
{
	var button = document.createElement('button');
	button.setAttribute('type', 'button');
	button.className = 'geBtn geFunctionActionBtn' + ((variant != null && variant !== '') ? (' geFunctionActionBtn' + variant) : '');
	mxUtils.write(button, labelText);

	if (clickHandler != null)
	{
		mxEvent.addListener(button, 'click', function(evt)
		{
			mxEvent.consume(evt);
			clickHandler(evt);
		});
	}

	return button;
};

FunctionDesignFormatPanel.prototype.getCellTitle = function(cell)
{
	if (cell == null)
	{
		return '';
	}

	var title = this.getCellAttribute(cell, 'ffModuleTitle');
	if (title != null && title !== '')
	{
		return title;
	}

	return this.editorUi.editor.graph.convertValueToString(cell) || cell.id || '';
};

FunctionDesignFormatPanel.prototype.getModuleMetaForCell = function(cell)
{
	if (cell == null)
	{
		return null;
	}

	var moduleCode = this.getCellAttribute(cell, 'ffModuleCode');
	if (moduleCode == null || moduleCode === '')
	{
		return null;
	}

	if (this.editorUi.functionFlowModuleMetaByCode == null)
	{
		return null;
	}

	return this.editorUi.functionFlowModuleMetaByCode[moduleCode] || null;
};

FunctionDesignFormatPanel.prototype.getModuleFieldOptions = function(cell, scope)
{
	var meta = this.getModuleMetaForCell(cell);
	var fields = (meta != null && Array.isArray(meta.fields)) ? meta.fields : [];
	var seen = {};
	var result = [];
	var fieldSqlTagOptions = Array.isArray(this.editorUi.functionFlowFieldSqlTagOptions) ? this.editorUi.functionFlowFieldSqlTagOptions : [];
	var resolveTagLabel = mxUtils.bind(this, function(field)
	{
		var candidateId = (field.fieldSqlTag != null) ? String(field.fieldSqlTag) : ((field.tagId != null) ? String(field.tagId) : '');
		if (candidateId !== '')
		{
			for (var i = 0; i < fieldSqlTagOptions.length; i++)
			{
				var option = fieldSqlTagOptions[i] || {};
				if (String(option.showid != null ? option.showid : '') === candidateId)
				{
					return mxUtils.trim(option.showname || '') || ('控件#' + candidateId);
				}
			}
		}

		var dataType = mxUtils.trim(field.dataType || '');
		if (dataType !== '')
		{
			return dataType;
		}

		return candidateId !== '' ? ('控件#' + candidateId) : '未分类';
	});

	for (var i = 0; i < fields.length; i++)
	{
		var field = fields[i] || {};
		var fieldScope = (field.scope || '').toString().toLowerCase();
		var isDetailField = fieldScope === 'detail' || field.rowField === true;
		if (scope === 'detail' && !isDetailField)
		{
			continue;
		}
		if (scope === 'main' && isDetailField)
		{
			continue;
		}

		var value = field.fieldName || '';
		var fieldKey = field.fieldKey || '';
		var dedupeKey = (fieldKey || value || '').toLowerCase();
		if (value === '' || dedupeKey === '' || seen[dedupeKey])
		{
			continue;
		}
		seen[dedupeKey] = true;

		var fieldLabel = field.fieldLabel || field.systemName || value;
		var controlTypeLabel = resolveTagLabel(field);
		var scopeLabel = isDetailField ? '明细' : '主数据';
		var flags = [];
		flags.push(scopeLabel);
		flags.push(controlTypeLabel);
		flags.push(field.visible === false ? '隐藏' : '显示');
		if (field.rowField === true)
		{
			flags.push('行字段');
		}
		if (field.fieldKey)
		{
			flags.push('Key ' + field.fieldKey);
		}
		if (field.width != null)
		{
			flags.push('宽度 ' + field.width);
		}

		result.push({
			controlTypeLabel: controlTypeLabel,
			dataType: field.dataType || '',
			editable: field.editable !== false,
			fieldKey: fieldKey,
			fieldLabel: fieldLabel,
			fieldName: value,
			fieldSqlTag: field.fieldSqlTag != null ? field.fieldSqlTag : field.tagId,
			formKey: field.formKey || '',
			label: fieldLabel + ' · ' + value + ' · ' + controlTypeLabel,
			metaText: flags.join(' · '),
			orderId: field.orderId != null ? field.orderId : null,
			rowField: field.rowField === true,
			scope: isDetailField ? 'detail' : 'main',
			scopeLabel: scopeLabel,
			searchKey: this.buildSearchKey([fieldLabel, value, fieldKey, field.systemName || '', controlTypeLabel]),
			systemName: field.systemName || '',
			visible: field.visible !== false,
			value: value,
			width: (field.width != null) ? field.width : 120
		});
	}

	return result.sort(function(a, b)
	{
		var orderA = (a.orderId != null) ? a.orderId : Number.MAX_SAFE_INTEGER;
		var orderB = (b.orderId != null) ? b.orderId : Number.MAX_SAFE_INTEGER;
		if (orderA !== orderB)
		{
			return orderA - orderB;
		}
		return (a.fieldLabel || a.value || '').localeCompare((b.fieldLabel || b.value || ''), 'zh-Hans-CN');
	});
};

FunctionDesignFormatPanel.prototype.normalizeFieldLookupKey = function(value)
{
	return mxUtils.trim(value || '').toLowerCase().replace(/[\s_\-:：()（）\[\]【】.]/g, '');
};

FunctionDesignFormatPanel.prototype.findFieldOptionByReference = function(cell, scope, reference)
{
	var options = this.getModuleFieldOptions(cell, scope);
	var normalizedReference = this.normalizeFieldLookupKey(reference);
	if (normalizedReference === '')
	{
		return null;
	}

	for (var i = 0; i < options.length; i++)
	{
		var option = options[i] || {};
		var exactCandidates = [
			option.fieldKey,
			option.fieldName,
			option.fieldLabel,
			option.systemName
		];
		for (var j = 0; j < exactCandidates.length; j++)
		{
			if (this.normalizeFieldLookupKey(exactCandidates[j]) === normalizedReference)
			{
				return option;
			}
		}
	}

	for (var i = 0; i < options.length; i++)
	{
		var option = options[i] || {};
		var fuzzyCandidates = [
			option.fieldKey,
			option.fieldName,
			option.fieldLabel,
			option.systemName
		];
		for (var j = 0; j < fuzzyCandidates.length; j++)
		{
			var candidateKey = this.normalizeFieldLookupKey(fuzzyCandidates[j]);
			if (candidateKey !== '' && (candidateKey.indexOf(normalizedReference) >= 0 || normalizedReference.indexOf(candidateKey) >= 0))
			{
				return option;
			}
		}
	}

	return null;
};

FunctionDesignFormatPanel.prototype.findBestTargetFieldOption = function(ownerCell, preferredScope, sourceFieldOption)
{
	if (ownerCell == null || sourceFieldOption == null)
	{
		return null;
	}

	var options = this.getModuleFieldOptions(ownerCell, preferredScope);
	if (options.length === 0)
	{
		options = this.getModuleFieldOptions(ownerCell, 'main').concat(this.getModuleFieldOptions(ownerCell, 'detail'));
	}

	var normalizedSourceKey = this.normalizeFieldLookupKey(sourceFieldOption.fieldKey);
	var normalizedSourceName = this.normalizeFieldLookupKey(sourceFieldOption.fieldName);
	var normalizedSourceLabel = this.normalizeFieldLookupKey(sourceFieldOption.fieldLabel);

	for (var i = 0; i < options.length; i++)
	{
		if (normalizedSourceKey !== '' && this.normalizeFieldLookupKey(options[i].fieldKey) === normalizedSourceKey)
		{
			return options[i];
		}
	}

	for (var i = 0; i < options.length; i++)
	{
		if (normalizedSourceName !== '' && this.normalizeFieldLookupKey(options[i].fieldName) === normalizedSourceName)
		{
			return options[i];
		}
	}

	for (var i = 0; i < options.length; i++)
	{
		var labelKey = this.normalizeFieldLookupKey(options[i].fieldLabel);
		if (normalizedSourceLabel !== '' && labelKey === normalizedSourceLabel)
		{
			return options[i];
		}
	}

	for (var i = 0; i < options.length; i++)
	{
		var labelKey = this.normalizeFieldLookupKey(options[i].fieldLabel);
		if (normalizedSourceLabel !== '' && labelKey !== '' && (labelKey.indexOf(normalizedSourceLabel) >= 0 || normalizedSourceLabel.indexOf(labelKey) >= 0))
		{
			return options[i];
		}
	}

	return null;
};

FunctionDesignFormatPanel.prototype.getNodeMappings = function(cell)
{
	return this.editorUi.parseFunctionFlowJsonAttr(this.getCellAttribute(cell, 'ffFieldMappings'), []);
};

FunctionDesignFormatPanel.prototype.saveNodeMappings = function(cell, mappings)
{
	this.applyCellAttributes(cell, {
		ffFieldMappings: JSON.stringify(mappings || [])
	});
};

FunctionDesignFormatPanel.prototype.buildSearchKey = function(parts)
{
	var joined = '';
	var initials = [];

	for (var i = 0; i < parts.length; i++)
	{
		var part = mxUtils.trim(parts[i] || '');
		if (part === '')
		{
			continue;
		}

		joined += ' ' + part.toLowerCase();
		var tokens = part.split(/[\s\/_\-]+/);
		for (var j = 0; j < tokens.length; j++)
		{
			var token = mxUtils.trim(tokens[j] || '');
			if (token !== '')
			{
				initials.push(token.charAt(0).toLowerCase());
			}
		}
	}

	return joined + ' ' + initials.join('');
};

FunctionDesignFormatPanel.prototype.getNodeChoices = function()
{
	var graph = this.editorUi.editor.graph;
	var model = graph.getModel();
	var parent = graph.getDefaultParent();
	var result = [];

	for (var i = 0; i < model.getChildCount(parent); i++)
	{
		var cell = model.getChildAt(parent, i);
		if (!model.isVertex(cell))
		{
			continue;
		}

		result.push({
			cell: cell,
			cellId: cell.id,
			label: this.getCellTitle(cell),
			moduleCode: this.getCellAttribute(cell, 'ffModuleCode') || '',
			moduleKind: this.getCellAttribute(cell, 'ffModuleKind') || ''
		});
	}

	return result;
};

FunctionDesignFormatPanel.prototype.ensureModuleMetaForCell = function(cell)
{
	if (cell == null || this.editorUi.requestFunctionFlowModuleMeta == null)
	{
		return;
	}

	var moduleCode = this.getCellAttribute(cell, 'ffModuleCode');
	if (moduleCode == null || moduleCode === '')
	{
		return;
	}

	if (this.getModuleMetaForCell(cell) == null)
	{
		this.editorUi.requestFunctionFlowModuleMeta(moduleCode, cell.id);
	}
};

FunctionDesignFormatPanel.prototype.guessFieldName = function(fieldOptions, candidates)
{
	var exactMatch = null;
	var includeMatch = null;

	for (var i = 0; i < fieldOptions.length; i++)
	{
		var option = fieldOptions[i] || {};
		var haystack = ((option.fieldName || '') + ' ' + (option.fieldLabel || '')).toLowerCase().replace(/[\s_\-]/g, '');

		for (var j = 0; j < candidates.length; j++)
		{
			var candidate = (candidates[j] || '').toLowerCase().replace(/[\s_\-]/g, '');
			if (candidate === '')
			{
				continue;
			}

			if (haystack === candidate)
			{
				exactMatch = option.fieldName;
				break;
			}
			if (includeMatch == null && haystack.indexOf(candidate) >= 0)
			{
				includeMatch = option.fieldName;
			}
		}

		if (exactMatch != null)
		{
			break;
		}
	}

	return exactMatch || includeMatch || '';
};

FunctionDesignFormatPanel.prototype.buildSuggestedNodeAttributes = function(cell, option, moduleMeta)
{
	var values = {
		ffModuleCode: option.code || '',
		ffModuleId: option.id || '',
		ffModuleKind: option.moduleKind || '',
		ffModuleNo: this.getCellAttribute(cell, 'ffModuleNo') || option.code || '',
		ffModuleTitle: option.title || ''
	};

	if (moduleMeta != null)
	{
		var mainFields = this.getModuleFieldOptions(cell, 'main');
		var detailFields = this.getModuleFieldOptions(cell, 'detail');

		if (this.getCellAttribute(cell, 'ffMainTable') === '' && moduleMeta.mainTable)
		{
			values.ffMainTable = moduleMeta.mainTable;
		}
		if (this.getCellAttribute(cell, 'ffDetailTable') === '' && moduleMeta.detailTable)
		{
			values.ffDetailTable = moduleMeta.detailTable;
		}
		if (this.getCellAttribute(cell, 'ffPrimarySql') === '' && moduleMeta.mainSql)
		{
			values.ffPrimarySql = moduleMeta.mainSql;
		}
		if (this.getCellAttribute(cell, 'ffDetailSql') === '' && moduleMeta.detailSql)
		{
			values.ffDetailSql = moduleMeta.detailSql;
		}
		if (this.getCellAttribute(cell, 'ffFormKey') === '' && moduleMeta.formKey)
		{
			values.ffFormKey = moduleMeta.formKey;
		}
		if (this.getCellAttribute(cell, 'ffCondKey') === '' && moduleMeta.condKey)
		{
			values.ffCondKey = moduleMeta.condKey;
		}
		if (this.getCellAttribute(cell, 'ffDefaultMainAlias') === '')
		{
			values.ffDefaultMainAlias = 'a';
		}
		if (this.getCellAttribute(cell, 'ffDefaultDetailAlias') === '')
		{
			values.ffDefaultDetailAlias = 'b';
		}
		if (this.getCellAttribute(cell, 'ffMainPk') === '')
		{
			values.ffMainPk = this.guessFieldName(mainFields, ['id', 'billid', 'fid', '单据id']);
		}
		if (this.getCellAttribute(cell, 'ffMainBillNoField') === '')
		{
			values.ffMainBillNoField = this.guessFieldName(mainFields, ['billno', 'bill_code', 'billcode', 'djh', '单号']);
		}
		if (this.getCellAttribute(cell, 'ffDetailPk') === '')
		{
			values.ffDetailPk = this.guessFieldName(detailFields, ['detailid', 'mxid', 'detail_id', 'mx_id']);
		}
		if (this.getCellAttribute(cell, 'ffDetailFkToMain') === '')
		{
			values.ffDetailFkToMain = this.guessFieldName(detailFields, ['billid', 'mainid', 'fid', 'bill_id', 'main_id']);
		}
	}

	return values;
};

FunctionDesignFormatPanel.prototype.copyText = function(value)
{
	var text = value || '';

	if (navigator.clipboard != null && navigator.clipboard.writeText != null)
	{
		navigator.clipboard.writeText(text);
		return;
	}

	var input = document.createElement('textarea');
	input.style.position = 'fixed';
	input.style.opacity = '0';
	input.value = text;
	document.body.appendChild(input);
	input.select();

	try
	{
		document.execCommand('copy');
	}
	catch (e)
	{
		// ignore
	}

	document.body.removeChild(input);
};

FunctionDesignFormatPanel.prototype.addCodeBlock = function(parent, labelText, value)
{
	var wrapper = document.createElement('div');
	wrapper.className = 'geFunctionCodeShell';

	var header = document.createElement('div');
	header.className = 'geFunctionCodeHeader';
	var title = document.createElement('div');
	title.className = 'geFunctionCodeTitle';
	mxUtils.write(title, labelText);
	header.appendChild(title);
	header.appendChild(this.createActionButton('复制', 'Mini', mxUtils.bind(this, function()
	{
		this.copyText(value || '');
	})));
	wrapper.appendChild(header);

	var code = document.createElement('pre');
	code.className = 'geFunctionCodeBlock';
	mxUtils.write(code, value || '暂无');
	wrapper.appendChild(code);
	parent.appendChild(wrapper);
};

FunctionDesignFormatPanel.prototype.openDialog = function(titleText)
{
	var overlay = document.createElement('div');
	overlay.className = 'geFunctionModalOverlay';

	var dialog = document.createElement('div');
	dialog.className = 'geFunctionModal';
	overlay.appendChild(dialog);

	var header = document.createElement('div');
	header.className = 'geFunctionModalHeader';
	dialog.appendChild(header);

	var title = document.createElement('div');
	title.className = 'geFunctionModalTitle';
	mxUtils.write(title, titleText);
	header.appendChild(title);
	header.appendChild(this.createActionButton('关闭', 'Ghost', function()
	{
		if (overlay.parentNode != null)
		{
			overlay.parentNode.removeChild(overlay);
		}
	}));

	var body = document.createElement('div');
	body.className = 'geFunctionModalBody';
	dialog.appendChild(body);

	var footer = document.createElement('div');
	footer.className = 'geFunctionModalFooter';
	dialog.appendChild(footer);

	document.body.appendChild(overlay);

	return {
		body: body,
		close: function()
		{
			if (overlay.parentNode != null)
			{
				overlay.parentNode.removeChild(overlay);
			}
		},
		footer: footer
	};
};

FunctionDesignFormatPanel.prototype.renderEdgePanel = function(cell)
{
	var graph = this.editorUi.editor.graph;
	var sourceCell = cell.source;
	var targetCell = cell.target;
	var panel = this.container;
	var sourceFields = this.getModuleFieldOptions(sourceCell, 'main').concat(this.getModuleFieldOptions(sourceCell, 'detail'));
	var targetFields = this.getModuleFieldOptions(targetCell, 'main').concat(this.getModuleFieldOptions(targetCell, 'detail'));
	var self = this;

	this.ensureModuleMetaForCell(sourceCell);
	this.ensureModuleMetaForCell(targetCell);

	var summarySection = this.createSection('关系配置卡片', null);
	panel.appendChild(summarySection.section);

	var summaryCard = document.createElement('div');
	summaryCard.className = 'geFunctionActiveCard geFunctionActiveCardStrong';
	summarySection.body.appendChild(summaryCard);

	var summaryLabel = document.createElement('div');
	summaryLabel.className = 'geFunctionActiveCardLabel';
	mxUtils.write(summaryLabel, '来源 -> 目标');
	summaryCard.appendChild(summaryLabel);

	var summaryValue = document.createElement('div');
	summaryValue.className = 'geFunctionActiveCardValue';
	mxUtils.write(summaryValue, this.getCellTitle(sourceCell) + ' -> ' + this.getCellTitle(targetCell));
	summaryCard.appendChild(summaryValue);

	var summaryMeta = document.createElement('div');
	summaryMeta.className = 'geFunctionActiveCardMeta';
	mxUtils.write(summaryMeta, (this.getCellAttribute(sourceCell, 'ffModuleCode') || '-') + ' / ' + (this.getCellAttribute(targetCell, 'ffModuleCode') || '-'));
	summaryCard.appendChild(summaryMeta);

	var summaryGrid = document.createElement('div');
	summaryGrid.className = 'geFunctionMetaGrid';
	summarySection.body.appendChild(summaryGrid);

	var addSummaryItem = function(labelText, value)
	{
		var item = document.createElement('div');
		item.className = 'geFunctionMetaItem';
		var label = document.createElement('div');
		label.className = 'geFunctionMetaLabel';
		mxUtils.write(label, labelText);
		item.appendChild(label);
		var content = document.createElement('div');
		content.className = 'geFunctionMetaValue';
		mxUtils.write(content, value || '-');
		item.appendChild(content);
		summaryGrid.appendChild(item);
	};

	addSummaryItem('来源节点', this.getCellTitle(sourceCell));
	addSummaryItem('目标节点', this.getCellTitle(targetCell));
	addSummaryItem('关系编码', this.getCellAttribute(cell, 'ffRelationCode') || '-');
	addSummaryItem('连接方式', this.getCellAttribute(cell, 'ffJoinType') || 'left join');

	var relationSection = this.createSection('连线属性', null);
	panel.appendChild(relationSection.section);

	this.addField(relationSection.body, '关系编码', this.getCellAttribute(cell, 'ffRelationCode'), mxUtils.bind(this, function(value)
	{
		this.applyCellAttributes(cell, {ffRelationCode: value});
	}), '例如：sale_to_stock', false, null);

	this.addSelectField(relationSection.body, '连接方式', this.getCellAttribute(cell, 'ffJoinType'), mxUtils.bind(this, function(value)
	{
		this.applyCellAttributes(cell, {ffJoinType: value});
	}), [
		{label: 'LEFT JOIN', value: 'left join'},
		{label: 'INNER JOIN', value: 'inner join'},
		{label: 'RIGHT JOIN', value: 'right join'},
		{label: 'FULL OUTER JOIN', value: 'full outer join'}
	]);

	this.addField(relationSection.body, '桥接表', this.getCellAttribute(cell, 'ffBridgeTable'), mxUtils.bind(this, function(value)
	{
		this.applyCellAttributes(cell, {ffBridgeTable: value});
	}), '中间桥接表', false, null);

	this.addComboField(relationSection.body, '来源字段', this.getCellAttribute(cell, 'ffFromField'), mxUtils.bind(this, function(value)
	{
		this.applyCellAttributes(cell, {ffFromField: value});
	}), sourceFields, '请选择来源字段', null);

	this.addComboField(relationSection.body, '目标字段', this.getCellAttribute(cell, 'ffToField'), mxUtils.bind(this, function(value)
	{
		this.applyCellAttributes(cell, {ffToField: value});
	}), targetFields, '请选择目标字段', null);

	this.addComboField(relationSection.body, '桥接来源字段', this.getCellAttribute(cell, 'ffBridgeFromField'), mxUtils.bind(this, function(value)
	{
		this.applyCellAttributes(cell, {ffBridgeFromField: value});
	}), sourceFields, '桥接来源字段', null);

	this.addComboField(relationSection.body, '桥接目标字段', this.getCellAttribute(cell, 'ffBridgeToField'), mxUtils.bind(this, function(value)
	{
		this.applyCellAttributes(cell, {ffBridgeToField: value});
	}), targetFields, '桥接目标字段', null);

	this.addSelectField(relationSection.body, '基数关系', this.getCellAttribute(cell, 'ffCardinality'), mxUtils.bind(this, function(value)
	{
		this.applyCellAttributes(cell, {ffCardinality: value});
	}), [
		{label: '1:1', value: '1:1'},
		{label: '1:N', value: '1:N'},
		{label: 'N:1', value: 'N:1'},
		{label: 'N:N', value: 'N:N'}
	]);

	this.addSelectField(relationSection.body, '明细关联模式', this.getCellAttribute(cell, 'ffDetailLinkMode'), mxUtils.bind(this, function(value)
	{
		this.applyCellAttributes(cell, {ffDetailLinkMode: value});
	}), [
		{label: 'main', value: 'main'},
		{label: 'detail', value: 'detail'},
		{label: 'bridge', value: 'bridge'}
	]);

	var passSection = this.createSection('传参透传', null);
	panel.appendChild(passSection.section);

	var passList = document.createElement('div');
	passList.className = 'geFunctionPassList';
	passSection.body.appendChild(passList);

	var readPassFields = function()
	{
		return self.editorUi.parseFunctionFlowJsonAttr(self.getCellAttribute(cell, 'ffPassFields'), []);
	};

	var savePassFields = function(nextPassFields)
	{
		self.applyCellAttributes(cell, {ffPassFields: JSON.stringify(nextPassFields || [])});
	};

	var renderPassFields = function()
	{
		passList.innerText = '';
		var passFields = readPassFields();

		if (passFields.length === 0)
		{
			var empty = document.createElement('div');
			empty.className = 'geFunctionBindEmpty';
			mxUtils.write(empty, '暂无传参配置');
			passList.appendChild(empty);
		}

		for (var i = 0; i < passFields.length; i++)
		{
			(function(index)
			{
				var passField = passFields[index] || {};
				var item = document.createElement('div');
				item.className = 'geFunctionPassItem';
				passList.appendChild(item);

				self.addComboField(item, '来源字段', passField.fromField || '', function(value)
				{
					var next = readPassFields();
					next[index] = mxUtils.extend({}, next[index] || {}, {fromField: value});
					savePassFields(next);
				}, sourceFields, '例如：id', null);

				self.addField(item, '目标参数', passField.toParam || '', function(value)
				{
					var next = readPassFields();
					next[index] = mxUtils.extend({}, next[index] || {}, {toParam: value});
					savePassFields(next);
				}, '例如：billId', false, null);

				item.appendChild(self.createActionButton('删除', 'Danger', function()
				{
					var next = readPassFields();
					next.splice(index, 1);
					savePassFields(next);
				}));
			})(i);
		}
	};

	passSection.header.appendChild(this.createActionButton('新增传参', 'Primary', function()
	{
		var next = readPassFields();
		next.push({fromField: '', toParam: ''});
		savePassFields(next);
	}));
	renderPassFields();
};

/**
 * Creates the function design panel UI.
 */
FunctionDesignFormatPanel.prototype.init = function()
{
	var ui = this.editorUi;
	var graph = ui.editor.graph;
	var model = graph.getModel();
	var cell = graph.getSelectionCell();
	var moduleOptions = ui.functionFlowModuleOptions || [];
	var panel = this.container;
	var self = this;
	if (panel.className.indexOf('geFunctionPanelRoot') < 0)
	{
		panel.className += ' geFunctionPanelRoot';
	}

	if (cell == null || !model.isVertex(cell))
	{
		if (cell != null && model.isEdge(cell))
		{
			var edgeSectionState = this.createSection('功能设计', null);
			var edgeText = document.createElement('div');
			edgeText.className = 'geFunctionEmptyState';
			mxUtils.write(edgeText, '连线右侧配置已收起，请双击单据后在弹窗里调整来源关系。');
			edgeSectionState.body.appendChild(edgeText);
			panel.appendChild(edgeSectionState.section);
			return;
		}

		var emptySectionState = this.createSection('功能设计', null);
		var emptyText = document.createElement('div');
		emptyText.className = 'geFunctionEmptyState';
		mxUtils.write(emptyText, '请选择一个节点或连线');
		emptySectionState.body.appendChild(emptyText);
		panel.appendChild(emptySectionState.section);
		return;
	}

	var nodeChoices = this.getNodeChoices();
	for (var nc = 0; nc < nodeChoices.length; nc++)
	{
		this.ensureModuleMetaForCell(nodeChoices[nc].cell);
	}

	var incomingEdges = [];
	var outgoingEdges = [];
	for (var edgeIndex = 0; edgeIndex < model.getEdgeCount(cell); edgeIndex++)
	{
		var connectedEdge = model.getEdgeAt(cell, edgeIndex);
		if (connectedEdge == null)
		{
			continue;
		}

		if (connectedEdge.target === cell)
		{
			incomingEdges.push(connectedEdge);
		}

		if (connectedEdge.source === cell)
		{
			outgoingEdges.push(connectedEdge);
		}
	}

	var isSourceBlock = outgoingEdges.length > 0;
	var isBillBlock = incomingEdges.length > 0;

	var moduleTitle = this.getCellAttribute(cell, 'ffModuleTitle');
	var moduleCode = this.getCellAttribute(cell, 'ffModuleCode');
	var moduleId = this.getCellAttribute(cell, 'ffModuleId');
	var moduleNo = this.getCellAttribute(cell, 'ffModuleNo');
	var moduleMeta = this.getModuleMetaForCell(cell);
	var preview = ui.functionFlowPreviewData || {sourceSql: '', detailSql: '', gridJson: [], validationMessages: []};
	var fieldMappings = this.getNodeMappings(cell);

	var getScopeMappings = function(scope)
	{
		var result = [];
		for (var i = 0; i < fieldMappings.length; i++)
		{
			var mapping = fieldMappings[i] || {};
			if ((scope === 'main' && mapping.mappingScope !== 'detail' && mapping.mappingScope !== 'grid') ||
				mapping.mappingScope === scope)
			{
				result.push(mapping);
			}
		}
		return result;
	};

	var findNodeChoice = function(cellId)
	{
		for (var i = 0; i < nodeChoices.length; i++)
		{
			if (nodeChoices[i].cellId === cellId)
			{
				return nodeChoices[i];
			}
		}
		return null;
	};

	var findFieldOption = function(sourceCellId, sourceTableScope, sourceField)
	{
		var sourceNode = findNodeChoice(sourceCellId);
		if (sourceNode == null)
		{
			return null;
		}

		return self.findFieldOptionByReference(sourceNode.cell, sourceTableScope || 'main', sourceField || '');
	};

	var createMappingId = function(scope)
	{
		ui.functionFlowMappingSeq = (ui.functionFlowMappingSeq || 0) + 1;
		return cell.id + '_' + scope + '_' + ui.functionFlowMappingSeq;
	};

	var normalizeMapping = function(mapping, scope)
	{
		var next = mxUtils.extend({}, mapping || {});
		var sourceCellId = mxUtils.trim(next.sourceCellId || cell.id);
		var sourceTableScope = mxUtils.trim(next.sourceTableScope || ((scope === 'detail') ? 'detail' : 'main'));
		var fieldOption = findFieldOption(sourceCellId, sourceTableScope, next.sourceField || '');
		var targetScope = scope === 'detail' ? 'detail' : ((sourceTableScope === 'detail') ? 'detail' : 'main');
		var matchedOwnerField = self.findBestTargetFieldOption(cell, targetScope, fieldOption);
		var width = parseInt(next.width, 10);
		var orderNo = parseInt(next.orderNo, 10);
		var explicitVisible = typeof next.isVisible === 'boolean' ? next.isVisible : null;

		next.id = next.id || createMappingId(scope);
		next.ownerCellId = cell.id;
		next.mappingScope = scope;
		next.sourceCellId = sourceCellId;
		next.sourceTableScope = sourceTableScope;
		next.exprType = mxUtils.trim(next.exprType || 'field');
		next.exprText = next.exprText || '';
		next.aggregateFunc = next.aggregateFunc || '';
		next.targetField = mxUtils.trim(next.targetField || (matchedOwnerField != null ? matchedOwnerField.fieldName : '') || next.sourceField || (fieldOption != null ? fieldOption.fieldName : ''));
		next.targetLabel = mxUtils.trim(next.targetLabel || (matchedOwnerField != null ? matchedOwnerField.fieldLabel : '') || (fieldOption != null ? fieldOption.fieldLabel : '') || next.targetField);
		next.sourceField = mxUtils.trim(next.sourceField || (fieldOption != null ? fieldOption.fieldName : ''));
		next.isGroupBy = next.isGroupBy === true;
		next.isRequired = next.isRequired === true;
		next.isVisible = explicitVisible != null ? explicitVisible : ((matchedOwnerField != null && matchedOwnerField.visible === false) ? false : ((fieldOption != null && fieldOption.visible === false) ? false : true));
		next.width = !isNaN(width) && width > 0 ? width : ((matchedOwnerField != null && matchedOwnerField.width != null) ? matchedOwnerField.width : ((fieldOption != null && fieldOption.width != null) ? fieldOption.width : 120));
		next.orderNo = !isNaN(orderNo) && orderNo > 0 ? orderNo : ((matchedOwnerField != null && matchedOwnerField.orderId != null) ? matchedOwnerField.orderId : ((fieldOption != null && fieldOption.orderId != null) ? fieldOption.orderId : 1));
		return next;
	};

	var resequenceMappings = function(mappings, preserveExistingOrder)
	{
		var next = [];
		for (var i = 0; i < mappings.length; i++)
		{
			var item = normalizeMapping(mappings[i], mappings[i].mappingScope || 'main');
			item.orderNo = (preserveExistingOrder === true && item.orderNo != null && item.orderNo > 0) ? item.orderNo : (i + 1);
			next.push(item);
		}
		return next;
	};

	var saveScopes = function(mainMappings, detailMappings, gridMappings)
	{
		var next = [];
		for (var i = 0; i < mainMappings.length; i++)
		{
			next.push(normalizeMapping(mainMappings[i], 'main'));
		}
		for (var j = 0; j < detailMappings.length; j++)
		{
			next.push(normalizeMapping(detailMappings[j], 'detail'));
		}
		for (var k = 0; k < gridMappings.length; k++)
		{
			next.push(normalizeMapping(gridMappings[k], 'grid'));
		}

		self.saveNodeMappings(cell, next);
	};

	var readScopes = function()
	{
		var current = self.getNodeMappings(cell);
		var nextMain = [];
		var nextDetail = [];
		var nextGrid = [];
		for (var i = 0; i < current.length; i++)
		{
			var mapping = current[i] || {};
			if (mapping.mappingScope === 'detail')
			{
				nextDetail.push(mapping);
			}
			else if (mapping.mappingScope === 'grid')
			{
				nextGrid.push(mapping);
			}
			else
			{
				nextMain.push(mapping);
			}
		}

		return {
			detail: nextDetail,
			grid: nextGrid,
			main: nextMain
		};
	};

	var readDrillColumns = function()
	{
		return self.editorUi.parseFunctionFlowJsonAttr(self.getCellAttribute(cell, 'ffDrillColumns'), []);
	};

	var normalizeDrillColumn = function(item, index)
	{
		var next = mxUtils.extend({}, item || {});
		var scope = mxUtils.trim(next.scope || 'main');
		var fieldOption = self.findFieldOptionByReference(cell, scope, next.fieldName || '');
		var width = parseInt(next.width, 10);
		var orderNo = parseInt(next.orderNo, 10);

		next.id = next.id || (cell.id + '_drill_' + index);
		next.scope = (scope === 'detail') ? 'detail' : 'main';
		next.fieldName = mxUtils.trim(next.fieldName || (fieldOption != null ? fieldOption.fieldName : ''));
		next.fieldLabel = mxUtils.trim(next.fieldLabel || (fieldOption != null ? fieldOption.fieldLabel : next.fieldName));
		next.fieldKey = mxUtils.trim(next.fieldKey || (fieldOption != null ? fieldOption.fieldKey : ''));
		next.width = !isNaN(width) && width > 0 ? width : ((fieldOption != null && fieldOption.width != null) ? fieldOption.width : 120);
		next.orderNo = !isNaN(orderNo) && orderNo > 0 ? orderNo : (index + 1);
		next.visible = next.visible !== false;
		return next;
	};

	var resequenceDrillColumns = function(columns)
	{
		var next = [];
		for (var i = 0; i < columns.length; i++)
		{
			var item = normalizeDrillColumn(columns[i], i);
			item.orderNo = i + 1;
			next.push(item);
		}
		return next;
	};

	var saveDrillColumns = function(columns)
	{
		self.applyCellAttributes(cell, {
			ffDrillColumns: JSON.stringify(resequenceDrillColumns(columns || []))
		});
	};

	var bindModuleOption = function(option)
	{
		if (option == null)
		{
			return;
		}

		var cachedMeta = (ui.functionFlowModuleMetaByCode != null) ? ui.functionFlowModuleMetaByCode[option.code || ''] : null;
		self.applyCellAttributes(cell, self.buildSuggestedNodeAttributes(cell, option, cachedMeta || null));

		ui.functionFlowModuleQuery = option.title || '';
		if (ui.setFunctionDesignMode != null)
		{
			ui.setFunctionDesignMode(true);
		}
		else
		{
			ui.functionDesignMode = true;
		}
		if (ui.requestFunctionFlowModuleMeta != null)
		{
			ui.requestFunctionFlowModuleMeta(option.code || '', cell.id);
		}
		ui.format.refresh();
	};

	var renderModuleSummaryCard = function(parent)
	{
		if (moduleTitle == null || moduleTitle === '')
		{
			return;
		}

		var activeModuleCard = document.createElement('div');
		activeModuleCard.className = 'geFunctionActiveCard geFunctionActiveCardStrong';

		var activeModuleLabel = document.createElement('div');
		activeModuleLabel.className = 'geFunctionActiveCardLabel';
		mxUtils.write(activeModuleLabel, '已绑定模块');
		activeModuleCard.appendChild(activeModuleLabel);

		var activeModuleValue = document.createElement('div');
		activeModuleValue.className = 'geFunctionActiveCardValue';
		mxUtils.write(activeModuleValue, moduleTitle);
		activeModuleCard.appendChild(activeModuleValue);

		var metaLine = document.createElement('div');
		metaLine.className = 'geFunctionActiveCardMeta';
		mxUtils.write(metaLine, (moduleNo || moduleCode || '-') + ' · ' + (moduleMeta != null ? (moduleMeta.moduleKind || '-') : (self.getCellAttribute(cell, 'ffModuleKind') || '-')));
		activeModuleCard.appendChild(metaLine);

		var tableLine = document.createElement('div');
		tableLine.className = 'geFunctionActiveCardMeta';
		mxUtils.write(tableLine, '主表 ' + (self.getCellAttribute(cell, 'ffMainTable') || '-') + ' / 明细 ' + (self.getCellAttribute(cell, 'ffDetailTable') || '-'));
		activeModuleCard.appendChild(tableLine);

		parent.appendChild(activeModuleCard);
	};

	var renderMetaGrid = function(parent)
	{
		if (moduleMeta == null)
		{
			var empty = document.createElement('div');
			empty.className = 'geFunctionBindEmpty';
			mxUtils.write(empty, '绑定模块后自动展示元数据');
			parent.appendChild(empty);
			return;
		}

		var grid = document.createElement('div');
		grid.className = 'geFunctionMetaGrid';
		parent.appendChild(grid);

		var addMetaItem = function(labelText, value)
		{
			var item = document.createElement('div');
			item.className = 'geFunctionMetaItem';
			var label = document.createElement('div');
			label.className = 'geFunctionMetaLabel';
			mxUtils.write(label, labelText);
			item.appendChild(label);
			var content = document.createElement('div');
			content.className = 'geFunctionMetaValue';
			mxUtils.write(content, value || '-');
			item.appendChild(content);
			grid.appendChild(item);
		};

		addMetaItem('模块类型', moduleMeta.moduleKind || '-');
		addMetaItem('主表', self.getCellAttribute(cell, 'ffMainTable') || moduleMeta.mainTable || '-');
		addMetaItem('明细表', self.getCellAttribute(cell, 'ffDetailTable') || moduleMeta.detailTable || '-');
		addMetaItem('formKey', moduleMeta.formKey || '-');
		addMetaItem('condKey', moduleMeta.condKey || '-');
		addMetaItem('主键字段', self.getCellAttribute(cell, 'ffMainPk') || '-');
		addMetaItem('单号字段', self.getCellAttribute(cell, 'ffMainBillNoField') || '-');
		addMetaItem('明细主键', self.getCellAttribute(cell, 'ffDetailPk') || '-');
		addMetaItem('明细关联主键', self.getCellAttribute(cell, 'ffDetailFkToMain') || '-');

		self.addCodeBlock(parent, '主 SQL', self.getCellAttribute(cell, 'ffPrimarySql') || moduleMeta.mainSql || '');
		self.addCodeBlock(parent, '明细 SQL', self.getCellAttribute(cell, 'ffDetailSql') || moduleMeta.detailSql || '');
	};

	var renderModuleSection = function(simplified)
	{
		var bindSectionState = self.createSection('模块', '按模块名、编号、路径实时过滤');
		panel.appendChild(bindSectionState.section);
		renderModuleSummaryCard(bindSectionState.body);

		var searchInput = document.createElement('input');
		searchInput.className = 'geFunctionInput';
		searchInput.setAttribute('type', 'text');
		searchInput.setAttribute('placeholder', '搜索模块名称 / 编号 / 路径');
		searchInput.value = ui.functionFlowModuleQuery || moduleTitle || '';
		var searchShell = document.createElement('div');
		searchShell.className = 'geFunctionAutocompleteShell';
		searchShell.appendChild(searchInput);
		bindSectionState.body.appendChild(searchShell);

		var searchMeta = document.createElement('div');
		searchMeta.className = 'geFunctionAutocompleteMeta';
		bindSectionState.body.appendChild(searchMeta);

		var list = document.createElement('div');
		list.className = 'geFunctionAutocompleteDropdown';
		searchShell.appendChild(list);

		var renderModuleList = function(forceOpen)
		{
			list.innerText = '';
			var keyword = self.buildSearchKey([searchInput.value || '']);
			var rawKeyword = mxUtils.trim(searchInput.value || '');
			ui.functionFlowModuleQuery = searchInput.value || '';
			var filtered = [];

			for (var i = 0; i < moduleOptions.length; i++)
			{
				var option = moduleOptions[i];
				var searchKey = self.buildSearchKey([
					option.title || '',
					option.code || '',
					option.moduleKind || '',
					option.pathLabel || '',
					option.moduleType || ''
				]);

				if (keyword === ' ' || rawKeyword === '' || searchKey.indexOf(keyword.trim()) >= 0)
				{
					filtered.push(option);
				}
			}

			filtered = filtered.slice(0, rawKeyword === '' ? 8 : 16);
			searchMeta.innerText = '';
			mxUtils.write(searchMeta, moduleOptions.length === 0 ? '当前子系统下没有可绑定模块' : ('候选模块 ' + filtered.length + ' / ' + moduleOptions.length));
			list.style.display = (forceOpen === true || document.activeElement === searchInput || rawKeyword !== '') ? 'flex' : 'none';

			if (moduleOptions.length === 0)
			{
				var empty = document.createElement('div');
				empty.className = 'geFunctionBindEmpty';
				mxUtils.write(empty, '当前子系统下没有可绑定模块');
				list.appendChild(empty);
				return filtered;
			}

			if (filtered.length === 0)
			{
				var empty = document.createElement('div');
				empty.className = 'geFunctionBindEmpty';
				mxUtils.write(empty, '没有找到匹配模块');
				list.appendChild(empty);
				return filtered;
			}

			for (var i = 0; i < filtered.length; i++)
			{
				(function(option)
				{
					var item = document.createElement('button');
					item.setAttribute('type', 'button');
					item.className = 'geFunctionBindItem' + ((option.id == moduleId) ? ' geActive' : '');
					list.appendChild(item);

					var row = document.createElement('div');
					row.className = 'geFunctionBindRow';
					item.appendChild(row);

					var title = document.createElement('span');
					title.className = 'geFunctionBindTitle';
					mxUtils.write(title, option.title || option.code || '未命名模块');
					row.appendChild(title);

					var metaRow = document.createElement('div');
					metaRow.className = 'geFunctionResultMeta';
					row.appendChild(metaRow);

					var codeBadge = document.createElement('span');
					codeBadge.className = 'geFunctionBindCode';
					mxUtils.write(codeBadge, option.code || '-');
					metaRow.appendChild(codeBadge);

					var kindBadge = document.createElement('span');
					kindBadge.className = 'geFunctionBindKind';
					mxUtils.write(kindBadge, option.moduleKind || '-');
					metaRow.appendChild(kindBadge);

					var path = document.createElement('div');
					path.className = 'geFunctionBindPath geFunctionBindPathWrap';
					mxUtils.write(path, option.pathLabel || '');
					item.appendChild(path);

					mxEvent.addListener(item, 'click', function()
					{
						searchInput.value = option.title || option.code || '';
						list.style.display = 'none';
						bindModuleOption(option);
					});
				})(filtered[i]);
			}

			return filtered;
		};

		mxEvent.addListener(searchInput, 'input', renderModuleList);
		mxEvent.addListener(searchInput, 'keyup', renderModuleList);
		mxEvent.addListener(searchInput, 'focus', function()
		{
			renderModuleList(true);
		});
		mxEvent.addListener(searchInput, 'keydown', function(evt)
		{
			if (evt.keyCode == 13)
			{
				var filtered = renderModuleList(true);
				if (filtered.length > 0)
				{
					bindModuleOption(filtered[0]);
					mxEvent.consume(evt);
				}
			}
		});
		mxEvent.addListener(searchInput, 'blur', function()
		{
			window.setTimeout(function()
			{
				list.style.display = 'none';
			}, 180);
		});
		renderModuleList(false);

		if (simplified === true)
		{
			return;
		}

		var metaSectionState = self.createSection('模块元数据', null);
		panel.appendChild(metaSectionState.section);
		renderMetaGrid(metaSectionState.body);
	};

	var appendNodeTagList = function(parent, titleText, cells, fallbackPrefix)
	{
		if (cells.length === 0)
		{
			return;
		}

		var title = document.createElement('div');
		title.className = 'geFunctionMetaLabel';
		mxUtils.write(title, titleText);
		parent.appendChild(title);

		var tagList = document.createElement('div');
		tagList.className = 'geFunctionMappingTags';
		parent.appendChild(tagList);

		for (var i = 0; i < cells.length; i++)
		{
			if (cells[i] == null)
			{
				continue;
			}

			var tag = document.createElement('span');
			tag.className = 'geFunctionTag';
			mxUtils.write(tag, self.getCellTitle(cells[i]) || (fallbackPrefix + ' ' + (i + 1)));
			tagList.appendChild(tag);
		}
	};

	var renderNodeSummarySection = function()
	{
		var summarySectionState = self.createSection('节点摘要', '功能设计模式下这里只保留基础信息');
		panel.appendChild(summarySectionState.section);

		var summaryCard = document.createElement('div');
		summaryCard.className = 'geFunctionActiveCard geFunctionActiveCardStrong';
		summarySectionState.body.appendChild(summaryCard);

		var summaryLabel = document.createElement('div');
		summaryLabel.className = 'geFunctionActiveCardLabel';
		mxUtils.write(summaryLabel, '当前角色');
		summaryCard.appendChild(summaryLabel);

		var roles = [];
		if (isSourceBlock)
		{
			roles.push('来源');
		}
		if (isBillBlock)
		{
			roles.push('单据');
		}
		if (roles.length === 0)
		{
			roles.push('未联通节点');
		}

		var summaryValue = document.createElement('div');
		summaryValue.className = 'geFunctionActiveCardValue';
		mxUtils.write(summaryValue, roles.join(' / '));
		summaryCard.appendChild(summaryValue);

		var summaryMeta = document.createElement('div');
		summaryMeta.className = 'geFunctionActiveCardMeta';
		mxUtils.write(summaryMeta, '来源输出 ' + outgoingEdges.length + ' 个单据 · 接收 ' + incomingEdges.length + ' 个来源');
		summaryCard.appendChild(summaryMeta);

		appendNodeTagList(summarySectionState.body, '输出到单据', outgoingEdges.map(function(edge)
		{
			return edge != null ? edge.target : null;
		}), '单据');
		appendNodeTagList(summarySectionState.body, '来源节点', incomingEdges.map(function(edge)
		{
			return edge != null ? edge.source : null;
		}), '来源');

		var hint = document.createElement('div');
		hint.className = 'geFunctionBindEmpty';
		if (incomingEdges.length > 1)
		{
			mxUtils.write(hint, '双击当前单据，会按来源名字弹出页签并调整基础连接类型。');
		}
		else if (isSourceBlock)
		{
			mxUtils.write(hint, '当前来源的复杂右侧配置已收起，只保留模块绑定和关系摘要。');
		}
		else
		{
			mxUtils.write(hint, '当前节点的复杂右侧配置已收起，只保留模块绑定和关系摘要。');
		}
		summarySectionState.body.appendChild(hint);
	};

	var renderKeySection = function()
	{
		var mainFieldOptions = self.getModuleFieldOptions(cell, 'main');
		var detailFieldOptions = self.getModuleFieldOptions(cell, 'detail');
		var configSectionState = self.createSection('主键与别名', null);
		panel.appendChild(configSectionState.section);

		self.addField(configSectionState.body, '模块编号', moduleNo, function(value)
		{
			self.applyCellAttributes(cell, {ffModuleNo: value});
		}, '例如：WH-001', false, null);
		self.addField(configSectionState.body, '主别名', self.getCellAttribute(cell, 'ffDefaultMainAlias'), function(value)
		{
			self.applyCellAttributes(cell, {ffDefaultMainAlias: value});
		}, '例如：a', false, null);
		self.addField(configSectionState.body, '明细别名', self.getCellAttribute(cell, 'ffDefaultDetailAlias'), function(value)
		{
			self.applyCellAttributes(cell, {ffDefaultDetailAlias: value});
		}, '例如：b', false, null);
		self.addComboField(configSectionState.body, '主键字段', self.getCellAttribute(cell, 'ffMainPk'), function(value)
		{
			self.applyCellAttributes(cell, {ffMainPk: value});
		}, mainFieldOptions, '例如：id', null);
		self.addComboField(configSectionState.body, '单号字段', self.getCellAttribute(cell, 'ffMainBillNoField'), function(value)
		{
			self.applyCellAttributes(cell, {ffMainBillNoField: value});
		}, mainFieldOptions, '例如：billno', null);
		self.addComboField(configSectionState.body, '明细主键', self.getCellAttribute(cell, 'ffDetailPk'), function(value)
		{
			self.applyCellAttributes(cell, {ffDetailPk: value});
		}, detailFieldOptions, '例如：detailid', null);
		self.addComboField(configSectionState.body, '明细关联主键', self.getCellAttribute(cell, 'ffDetailFkToMain'), function(value)
		{
			self.applyCellAttributes(cell, {ffDetailFkToMain: value});
		}, detailFieldOptions, '例如：billid', null);
		var fieldPenetrationInput = self.addField(configSectionState.body, '行字段穿透', self.getCellAttribute(cell, 'ffFieldPenetration'), function(value)
		{
			self.applyCellAttributes(cell, {ffFieldPenetration: value});
		}, '例如：detail.material_id -> inventory.material_id', false, null);

		var penetrationActionRow = document.createElement('div');
		penetrationActionRow.className = 'geFunctionItemActions';
		configSectionState.body.appendChild(penetrationActionRow);
		penetrationActionRow.appendChild(self.createActionButton('选择穿透字段', 'Mini', function()
		{
			var dialog = self.openDialog('选择字段穿透');
			var nodeChoices = self.getNodeChoices();
			var sourceCellSelect = document.createElement('select');
			sourceCellSelect.className = 'geFunctionInput';
			for (var i = 0; i < nodeChoices.length; i++)
			{
				var sourceOption = document.createElement('option');
				sourceOption.value = nodeChoices[i].cellId;
				mxUtils.write(sourceOption, nodeChoices[i].label + ((nodeChoices[i].moduleCode != null && nodeChoices[i].moduleCode !== '') ? (' · ' + nodeChoices[i].moduleCode) : ''));
				if (nodeChoices[i].cellId === cell.id)
				{
					sourceOption.selected = true;
				}
				sourceCellSelect.appendChild(sourceOption);
			}
			var sourceNodeField = self.createFieldShell(dialog.body, '来源节点', '');
			sourceNodeField.appendChild(sourceCellSelect);

			var sourceScopeSelect = document.createElement('select');
			sourceScopeSelect.className = 'geFunctionInput';
			[['main', '主数据'], ['detail', '明细数据']].forEach(function(item)
			{
				var option = document.createElement('option');
				option.value = item[0];
				mxUtils.write(option, item[1]);
				sourceScopeSelect.appendChild(option);
			});
			var sourceScopeField = self.createFieldShell(dialog.body, '来源范围', '');
			sourceScopeField.appendChild(sourceScopeSelect);

			var sourceFieldInput = document.createElement('input');
			sourceFieldInput.className = 'geFunctionInput';
			sourceFieldInput.setAttribute('type', 'text');
			var sourceFieldListId = 'geFunctionPenetrationSource_' + ((ui.functionFlowInputSeq = (ui.functionFlowInputSeq || 0) + 1));
			var sourceFieldList = document.createElement('datalist');
			sourceFieldList.setAttribute('id', sourceFieldListId);
			sourceFieldInput.setAttribute('list', sourceFieldListId);
			var sourceFieldShell = self.createFieldShell(dialog.body, '来源字段', '');
			sourceFieldShell.appendChild(sourceFieldInput);
			sourceFieldShell.appendChild(sourceFieldList);

			var targetScopeSelect = document.createElement('select');
			targetScopeSelect.className = 'geFunctionInput';
			[['main', '主数据'], ['detail', '明细数据']].forEach(function(item)
			{
				var option = document.createElement('option');
				option.value = item[0];
				mxUtils.write(option, item[1]);
				targetScopeSelect.appendChild(option);
			});
			var targetScopeField = self.createFieldShell(dialog.body, '目标范围', '');
			targetScopeField.appendChild(targetScopeSelect);

			var targetFieldInput = document.createElement('input');
			targetFieldInput.className = 'geFunctionInput';
			targetFieldInput.setAttribute('type', 'text');
			var targetFieldListId = 'geFunctionPenetrationTarget_' + ((ui.functionFlowInputSeq = (ui.functionFlowInputSeq || 0) + 1));
			var targetFieldList = document.createElement('datalist');
			targetFieldList.setAttribute('id', targetFieldListId);
			targetFieldInput.setAttribute('list', targetFieldListId);
			var targetFieldShell = self.createFieldShell(dialog.body, '目标字段', '');
			targetFieldShell.appendChild(targetFieldInput);
			targetFieldShell.appendChild(targetFieldList);

			var refreshPenetrationOptions = function()
			{
				var sourceNode = model.getCell(sourceCellSelect.value);
				self.ensureModuleMetaForCell(sourceNode);
				self.ensureModuleMetaForCell(cell);

				sourceFieldList.innerText = '';
				targetFieldList.innerText = '';

				var sourceOptions = self.getModuleFieldOptions(sourceNode, sourceScopeSelect.value);
				var targetOptions = self.getModuleFieldOptions(cell, targetScopeSelect.value);

				for (var i = 0; i < sourceOptions.length; i++)
				{
					var sourceItem = document.createElement('option');
					sourceItem.value = sourceOptions[i].fieldName;
					sourceItem.label = sourceOptions[i].label + ' · ' + (sourceOptions[i].metaText || '');
					sourceFieldList.appendChild(sourceItem);
				}

				for (var j = 0; j < targetOptions.length; j++)
				{
					var targetItem = document.createElement('option');
					targetItem.value = targetOptions[j].fieldName;
					targetItem.label = targetOptions[j].label + ' · ' + (targetOptions[j].metaText || '');
					targetFieldList.appendChild(targetItem);
				}
			};

			mxEvent.addListener(sourceCellSelect, 'change', refreshPenetrationOptions);
			mxEvent.addListener(sourceScopeSelect, 'change', refreshPenetrationOptions);
			mxEvent.addListener(targetScopeSelect, 'change', refreshPenetrationOptions);
			refreshPenetrationOptions();

			dialog.footer.appendChild(self.createActionButton('取消', 'Ghost', function()
			{
				dialog.close();
			}));
			dialog.footer.appendChild(self.createActionButton('写入穿透', 'Primary', function()
			{
				var nextValue = mxUtils.trim(sourceScopeSelect.value + '.' + mxUtils.trim(sourceFieldInput.value || '') + ' -> ' + targetScopeSelect.value + '.' + mxUtils.trim(targetFieldInput.value || ''));
				fieldPenetrationInput.value = nextValue;
				self.applyCellAttributes(cell, {ffFieldPenetration: nextValue});
				dialog.close();
			}));
		}));
	};

	var renderDrillSection = function()
	{
		var drillSectionState = self.createSection('下钻列配置', moduleCode ? '绑定模块后可直接勾选字段作为下钻列' : '先绑定模块，再配置下钻列');
		panel.appendChild(drillSectionState.section);

		var drillList = document.createElement('div');
		drillList.className = 'geFunctionMappingList';
		drillSectionState.body.appendChild(drillList);

		var openDrillDialog = function()
		{
			var dialog = self.openDialog('添加下钻列');
			var allOptions = self.getModuleFieldOptions(cell, 'main').concat(self.getModuleFieldOptions(cell, 'detail'));
			var selectedMap = {};

			if (allOptions.length === 0)
			{
				var empty = document.createElement('div');
				empty.className = 'geFunctionBindEmpty';
				mxUtils.write(empty, '当前模块还没有可选字段，请先完成模块绑定并等待元数据加载。');
				dialog.body.appendChild(empty);
				dialog.footer.appendChild(self.createActionButton('关闭', 'Primary', function()
				{
					dialog.close();
				}));
				return;
			}

			var searchInput = document.createElement('input');
			searchInput.className = 'geFunctionInput';
			searchInput.setAttribute('type', 'text');
			searchInput.setAttribute('placeholder', '搜索中文名 / 字段名 / fieldKey');
			dialog.body.appendChild(searchInput);

			var checkboxList = document.createElement('div');
			checkboxList.className = 'geFunctionCheckboxList';
			dialog.body.appendChild(checkboxList);

			var renderCheckboxes = function()
			{
				checkboxList.innerText = '';
				var keyword = self.buildSearchKey([searchInput.value || '']);
				for (var i = 0; i < allOptions.length; i++)
				{
					var option = allOptions[i];
					if (mxUtils.trim(searchInput.value || '') !== '' && option.searchKey.indexOf(keyword.trim()) < 0)
					{
						continue;
					}

					(function(option)
					{
						var item = document.createElement('label');
						item.className = 'geFunctionCheckboxItem';

						var checkbox = document.createElement('input');
						checkbox.setAttribute('type', 'checkbox');
						var optionKey = option.scope + ':' + option.fieldName;
						checkbox.checked = selectedMap[optionKey] === true;
						mxEvent.addListener(checkbox, 'change', function()
						{
							selectedMap[optionKey] = checkbox.checked;
						});
						item.appendChild(checkbox);

						var meta = document.createElement('div');
						meta.className = 'geFunctionCheckboxMeta';
						item.appendChild(meta);

						var title = document.createElement('div');
						title.className = 'geFunctionBindTitle';
						mxUtils.write(title, (option.fieldLabel || option.fieldName) + ' (' + option.fieldName + ')');
						meta.appendChild(title);

						var path = document.createElement('div');
						path.className = 'geFunctionBindPath geFunctionBindPathWrap';
						mxUtils.write(path, option.metaText || option.scopeLabel || '');
						meta.appendChild(path);

						checkboxList.appendChild(item);
					})(option);
				}
			};

			mxEvent.addListener(searchInput, 'input', renderCheckboxes);
			renderCheckboxes();

			dialog.footer.appendChild(self.createActionButton('取消', 'Ghost', function()
			{
				dialog.close();
			}));
			dialog.footer.appendChild(self.createActionButton('确认添加', 'Primary', function()
			{
				var current = readDrillColumns();
				var next = current.slice();
				for (var i = 0; i < allOptions.length; i++)
				{
					var option = allOptions[i];
					var optionKey = option.scope + ':' + option.fieldName;
					if (selectedMap[optionKey] !== true)
					{
						continue;
					}

					var exists = false;
					for (var j = 0; j < next.length; j++)
					{
						var entry = next[j] || {};
						if ((entry.scope || 'main') === option.scope && (entry.fieldName || '') === option.fieldName)
						{
							exists = true;
							break;
						}
					}

					if (!exists)
					{
						next.push({
							fieldKey: option.fieldKey || '',
							fieldLabel: option.fieldLabel || option.fieldName,
							fieldName: option.fieldName,
							orderNo: next.length + 1,
							scope: option.scope || 'main',
							visible: option.visible !== false,
							width: option.width != null ? option.width : 120
						});
					}
				}

				saveDrillColumns(next);
				dialog.close();
			}));
		};

		drillSectionState.header.appendChild(self.createActionButton('添加下钻列', 'Primary', openDrillDialog));

		var drillColumns = readDrillColumns();
		if (!moduleCode)
		{
			var empty = document.createElement('div');
			empty.className = 'geFunctionBindEmpty';
			mxUtils.write(empty, '先绑定模块，才能配置下钻列。');
			drillList.appendChild(empty);
			return;
		}

		if (drillColumns.length === 0)
		{
			var empty = document.createElement('div');
			empty.className = 'geFunctionBindEmpty';
			mxUtils.write(empty, '暂无下钻列，点击“添加下钻列”从正式字段配置里选择。');
			drillList.appendChild(empty);
			return;
		}

		for (var i = 0; i < drillColumns.length; i++)
		{
			(function(index)
			{
				var item = normalizeDrillColumn(drillColumns[index], index);
				var card = document.createElement('div');
				card.className = 'geFunctionMappingItem';
				drillList.appendChild(card);

				var top = document.createElement('div');
				top.className = 'geFunctionMappingItemTop';
				card.appendChild(top);

				var heading = document.createElement('div');
				top.appendChild(heading);

				var title = document.createElement('div');
				title.className = 'geFunctionMappingItemTitle';
				mxUtils.write(title, (item.fieldLabel || item.fieldName) + ' (' + item.fieldName + ')');
				heading.appendChild(title);

				var meta = document.createElement('div');
				meta.className = 'geFunctionMappingItemMeta';
				mxUtils.write(meta, ((item.scope === 'detail') ? '明细' : '主数据') + ' · 宽度 ' + (item.width || 120) + ' · 排序 ' + (item.orderNo || (index + 1)));
				heading.appendChild(meta);

				var tags = document.createElement('div');
				tags.className = 'geFunctionMappingTags';
				heading.appendChild(tags);

				var visibleTag = document.createElement('span');
				visibleTag.className = 'geFunctionTag';
				mxUtils.write(visibleTag, item.visible === false ? '隐藏' : '显示');
				tags.appendChild(visibleTag);

				if (item.fieldKey)
				{
					var fieldKeyTag = document.createElement('span');
					fieldKeyTag.className = 'geFunctionTag';
					mxUtils.write(fieldKeyTag, 'Key ' + item.fieldKey);
					tags.appendChild(fieldKeyTag);
				}

				var actions = document.createElement('div');
				actions.className = 'geFunctionItemActions';
				top.appendChild(actions);

				actions.appendChild(self.createActionButton('上移', 'Mini', function()
				{
					if (index === 0)
					{
						return;
					}
					var next = readDrillColumns();
					var current = next[index];
					next[index] = next[index - 1];
					next[index - 1] = current;
					saveDrillColumns(next);
				}));

				actions.appendChild(self.createActionButton('下移', 'Mini', function()
				{
					var next = readDrillColumns();
					if (index >= next.length - 1)
					{
						return;
					}
					var current = next[index];
					next[index] = next[index + 1];
					next[index + 1] = current;
					saveDrillColumns(next);
				}));

				actions.appendChild(self.createActionButton('删除', 'Danger', function()
				{
					var next = readDrillColumns();
					next.splice(index, 1);
					saveDrillColumns(next);
				}));
			})(i);
		}
	};

	var renderRuleSection = function()
	{
		var ruleSectionState = self.createSection('条件与 SQL', null);
		panel.appendChild(ruleSectionState.section);

		self.addField(ruleSectionState.body, '条件建立', self.getCellAttribute(cell, 'ffCondition'), function(value)
		{
			self.applyCellAttributes(cell, {ffCondition: value});
		}, '例如：status = \'APPROVED\'', true, null);
		self.addField(ruleSectionState.body, '主 SQL 生成', self.getCellAttribute(cell, 'ffPrimarySql'), function(value)
		{
			self.applyCellAttributes(cell, {ffPrimarySql: value});
		}, '例如：SELECT * FROM erp_order WHERE order_id = ${orderId}', true, null);
		self.addField(ruleSectionState.body, '明细 SQL 生成', self.getCellAttribute(cell, 'ffDetailSql'), function(value)
		{
			self.applyCellAttributes(cell, {ffDetailSql: value});
		}, '例如：SELECT * FROM erp_order_detail WHERE bill_id = ${billId}', true, null);
	};

	var openMappingPickerDialog = function(scope, defaultSourceTableScope)
	{
		var dialog = self.openDialog(scope === 'grid' ? '添加 Grid 字段' : (scope === 'detail' ? '添加明细字段映射' : '添加主字段映射'));
		var sourceNodeChoices = self.getNodeChoices();
		var controls = {};

		controls.sourceCell = document.createElement('select');
		controls.sourceCell.className = 'geFunctionInput';
		for (var i = 0; i < sourceNodeChoices.length; i++)
		{
			var sourceOption = document.createElement('option');
			sourceOption.value = sourceNodeChoices[i].cellId;
			mxUtils.write(sourceOption, sourceNodeChoices[i].label + ((sourceNodeChoices[i].moduleCode != null && sourceNodeChoices[i].moduleCode !== '') ? (' · ' + sourceNodeChoices[i].moduleCode) : ''));
			if (sourceNodeChoices[i].cellId === cell.id)
			{
				sourceOption.selected = true;
			}
			controls.sourceCell.appendChild(sourceOption);
		}

		var sourceCellField = self.createFieldShell(dialog.body, '来源节点', '');
		sourceCellField.appendChild(controls.sourceCell);

		controls.tableScope = document.createElement('select');
		controls.tableScope.className = 'geFunctionInput';
		[['main', '主数据'], ['detail', '明细数据']].forEach(function(item)
		{
			var option = document.createElement('option');
			option.value = item[0];
			mxUtils.write(option, item[1]);
			if (item[0] === defaultSourceTableScope)
			{
				option.selected = true;
			}
			controls.tableScope.appendChild(option);
		});
		var scopeField = self.createFieldShell(dialog.body, '来源范围', '');
		scopeField.appendChild(controls.tableScope);

		controls.search = document.createElement('input');
		controls.search.className = 'geFunctionInput';
		controls.search.setAttribute('type', 'text');
		controls.search.setAttribute('placeholder', '搜索字段名称或中文名');
		var searchField = self.createFieldShell(dialog.body, '字段过滤', '');
		searchField.appendChild(controls.search);

		var includeGridField = null;
		var includeGridCheck = null;
		if (scope !== 'grid')
		{
			includeGridField = self.createFieldShell(dialog.body, '批量行为', '');
			includeGridCheck = document.createElement('label');
			includeGridCheck.className = 'geFunctionCheckboxItem';
			var includeGridInput = document.createElement('input');
			includeGridInput.setAttribute('type', 'checkbox');
			includeGridCheck.appendChild(includeGridInput);
			var includeGridText = document.createElement('span');
			mxUtils.write(includeGridText, '同时加入 grid 配置');
			includeGridCheck.appendChild(includeGridText);
			includeGridField.appendChild(includeGridCheck);
		}

		var fieldList = document.createElement('div');
		fieldList.className = 'geFunctionCheckboxList';
		dialog.body.appendChild(fieldList);

		var checkedMap = {};
		var renderFieldList = function()
		{
			fieldList.innerText = '';
			var selectedCell = model.getCell(controls.sourceCell.value);
			self.ensureModuleMetaForCell(selectedCell);
			var fieldOptions = self.getModuleFieldOptions(selectedCell, controls.tableScope.value);
			var keyword = self.buildSearchKey([controls.search.value || '']).trim();

			if (fieldOptions.length === 0)
			{
				var empty = document.createElement('div');
				empty.className = 'geFunctionBindEmpty';
				mxUtils.write(empty, '该来源节点暂无可选字段，若刚绑定模块请稍候重开。');
				fieldList.appendChild(empty);
				return;
			}

			for (var i = 0; i < fieldOptions.length; i++)
			{
				var fieldOption = fieldOptions[i];
				var searchKey = self.buildSearchKey([fieldOption.fieldName, fieldOption.fieldLabel || '', fieldOption.fieldKey || '', fieldOption.controlTypeLabel || '']).trim();
				if (keyword !== '' && searchKey.indexOf(keyword) < 0)
				{
					continue;
				}

				(function(option)
				{
					var key = controls.sourceCell.value + '::' + controls.tableScope.value + '::' + option.value;
					var row = document.createElement('label');
					row.className = 'geFunctionCheckboxItem';
					fieldList.appendChild(row);

					var checkbox = document.createElement('input');
					checkbox.setAttribute('type', 'checkbox');
					checkbox.checked = checkedMap[key] === true;
					row.appendChild(checkbox);

					var text = document.createElement('div');
					text.className = 'geFunctionCheckboxMeta';
					row.appendChild(text);

					var title = document.createElement('div');
					title.className = 'geFunctionBindTitle';
					mxUtils.write(title, (option.fieldLabel || option.value) + ' (' + option.value + ')');
					text.appendChild(title);

					var meta = document.createElement('div');
					meta.className = 'geFunctionBindPath';
					mxUtils.write(meta, option.metaText || ('默认宽度 ' + (option.width || 120)));
					text.appendChild(meta);

					mxEvent.addListener(checkbox, 'change', function()
					{
						checkedMap[key] = checkbox.checked === true;
					});
				})(fieldOption);
			}

			if (fieldList.childNodes.length === 0)
			{
				var none = document.createElement('div');
				none.className = 'geFunctionBindEmpty';
				mxUtils.write(none, '没有找到匹配字段');
				fieldList.appendChild(none);
			}
		};

		mxEvent.addListener(controls.sourceCell, 'change', renderFieldList);
		mxEvent.addListener(controls.tableScope, 'change', renderFieldList);
		mxEvent.addListener(controls.search, 'input', renderFieldList);
		renderFieldList();

		dialog.footer.appendChild(self.createActionButton('取消', 'Ghost', function()
		{
			dialog.close();
		}));
		dialog.footer.appendChild(self.createActionButton('确认添加', 'Primary', function()
		{
			var scopes = readScopes();
			var nextMappings = scopes[scope].slice();
			var sourceCellId = controls.sourceCell.value;
			var sourceScope = controls.tableScope.value;
			var fieldOptions = self.getModuleFieldOptions(model.getCell(sourceCellId), sourceScope);
			var selectedFieldOptions = [];
			for (var i = 0; i < fieldOptions.length; i++)
			{
				var key = sourceCellId + '::' + sourceScope + '::' + fieldOptions[i].value;
				if (checkedMap[key] === true)
				{
					selectedFieldOptions.push(fieldOptions[i]);
				}
			}

			if (selectedFieldOptions.length === 0)
			{
				mxUtils.alert('请至少勾选一个字段');
				return;
			}

			var startOrder = nextMappings.length;
			for (var i = 0; i < selectedFieldOptions.length; i++)
			{
				nextMappings.push(normalizeMapping({
					exprType: 'field',
					orderNo: startOrder + i + 1,
					sourceCellId: sourceCellId,
					sourceField: selectedFieldOptions[i].value,
					sourceTableScope: sourceScope,
					targetField: selectedFieldOptions[i].fieldName,
					targetLabel: selectedFieldOptions[i].fieldLabel,
					width: selectedFieldOptions[i].width
				}, scope));
			}

			scopes[scope] = resequenceMappings(nextMappings, true);

			if (scope !== 'grid' && includeGridCheck != null && includeGridCheck.firstChild != null && includeGridCheck.firstChild.checked === true)
			{
				var gridMappings = scopes.grid.slice();
				for (var g = 0; g < selectedFieldOptions.length; g++)
				{
					gridMappings.push(normalizeMapping({
						exprType: 'field',
						orderNo: gridMappings.length + 1,
						sourceCellId: sourceCellId,
						sourceField: selectedFieldOptions[g].value,
						sourceTableScope: sourceScope,
						targetField: selectedFieldOptions[g].fieldName,
						targetLabel: selectedFieldOptions[g].fieldLabel,
						width: selectedFieldOptions[g].width
					}, 'grid'));
				}
				scopes.grid = resequenceMappings(gridMappings, true);
			}

			saveScopes(scopes.main, scopes.detail, scopes.grid);
			dialog.close();
		}));
	};

	var openMappingEditDialog = function(scope, mappingIndex)
	{
		var scopes = readScopes();
		var currentMappings = scopes[scope].slice();
		var current = currentMappings[mappingIndex];
		if (current == null)
		{
			return;
		}

		var dialog = self.openDialog('编辑映射');
		var controls = {};
		var sourceNodeChoices = self.getNodeChoices();

		controls.sourceCell = document.createElement('select');
		controls.sourceCell.className = 'geFunctionInput';
		for (var i = 0; i < sourceNodeChoices.length; i++)
		{
			var sourceOption = document.createElement('option');
			sourceOption.value = sourceNodeChoices[i].cellId;
			mxUtils.write(sourceOption, sourceNodeChoices[i].label);
			if (sourceNodeChoices[i].cellId === (current.sourceCellId || cell.id))
			{
				sourceOption.selected = true;
			}
			controls.sourceCell.appendChild(sourceOption);
		}
		var sourceFieldShell = self.createFieldShell(dialog.body, '来源节点', '');
		sourceFieldShell.appendChild(controls.sourceCell);

		controls.sourceScope = document.createElement('select');
		controls.sourceScope.className = 'geFunctionInput';
		[['main', '主数据'], ['detail', '明细数据']].forEach(function(item)
		{
			var option = document.createElement('option');
			option.value = item[0];
			mxUtils.write(option, item[1]);
			if (item[0] === (current.sourceTableScope || 'main'))
			{
				option.selected = true;
			}
			controls.sourceScope.appendChild(option);
		});
		var sourceScopeShell = self.createFieldShell(dialog.body, '来源范围', '');
		sourceScopeShell.appendChild(controls.sourceScope);

		controls.sourceField = document.createElement('input');
		controls.sourceField.className = 'geFunctionInput';
		controls.sourceField.setAttribute('type', 'text');
		controls.sourceField.value = current.sourceField || '';
		var sourceFieldDataListId = 'geFunctionEditField_' + ((ui.functionFlowInputSeq = (ui.functionFlowInputSeq || 0) + 1));
		var sourceFieldDataList = document.createElement('datalist');
		sourceFieldDataList.setAttribute('id', sourceFieldDataListId);
		controls.sourceField.setAttribute('list', sourceFieldDataListId);
		var sourceFieldEditorShell = self.createFieldShell(dialog.body, '来源字段', '');
		sourceFieldEditorShell.appendChild(controls.sourceField);
		sourceFieldEditorShell.appendChild(sourceFieldDataList);

		var renderSourceFieldOptions = function()
		{
			sourceFieldDataList.innerText = '';
			var options = self.getModuleFieldOptions(model.getCell(controls.sourceCell.value), controls.sourceScope.value);
			for (var i = 0; i < options.length; i++)
			{
				var option = document.createElement('option');
				option.value = options[i].value;
				option.label = options[i].label;
				sourceFieldDataList.appendChild(option);
			}
		};
		mxEvent.addListener(controls.sourceCell, 'change', renderSourceFieldOptions);
		mxEvent.addListener(controls.sourceScope, 'change', renderSourceFieldOptions);
		renderSourceFieldOptions();

		controls.targetField = self.addField(dialog.body, '目标字段', current.targetField || '', function() {}, '例如：bill_no', false, null);
		controls.targetLabel = self.addField(dialog.body, '目标标题', current.targetLabel || '', function() {}, '例如：单号', false, null);
		controls.exprType = document.createElement('select');
		controls.exprType.className = 'geFunctionInput';
		[['field', '字段'], ['expr', '表达式'], ['agg', '聚合'], ['constant', '常量']].forEach(function(item)
		{
			var option = document.createElement('option');
			option.value = item[0];
			mxUtils.write(option, item[1]);
			if (item[0] === (current.exprType || 'field'))
			{
				option.selected = true;
			}
			controls.exprType.appendChild(option);
		});
		var exprTypeShell = self.createFieldShell(dialog.body, '表达式类型', '');
		exprTypeShell.appendChild(controls.exprType);

		controls.exprText = self.addField(dialog.body, '表达式文本', current.exprText || '', function() {}, '例如：case when a.status = 1 then 1 else 0 end', true, null);
		controls.aggregateFunc = document.createElement('select');
		controls.aggregateFunc.className = 'geFunctionInput';
		[['', '无'], ['sum', 'SUM'], ['count', 'COUNT'], ['max', 'MAX'], ['min', 'MIN'], ['avg', 'AVG']].forEach(function(item)
		{
			var option = document.createElement('option');
			option.value = item[0];
			mxUtils.write(option, item[1]);
			if (item[0] === (current.aggregateFunc || ''))
			{
				option.selected = true;
			}
			controls.aggregateFunc.appendChild(option);
		});
		var aggShell = self.createFieldShell(dialog.body, '聚合函数', '');
		aggShell.appendChild(controls.aggregateFunc);

		controls.width = self.addField(dialog.body, '宽度', String(current.width != null ? current.width : 120), function() {}, '120', false, null);
		controls.orderNo = self.addField(dialog.body, '排序', String(current.orderNo != null ? current.orderNo : (mappingIndex + 1)), function() {}, '1', false, null);

		var checkRow = document.createElement('div');
		checkRow.className = 'geFunctionInlineRow';
		dialog.body.appendChild(checkRow);

		var buildCheck = function(labelText, checked)
		{
			var row = document.createElement('label');
			row.className = 'geFunctionCheckboxItem';
			var input = document.createElement('input');
			input.setAttribute('type', 'checkbox');
			input.checked = checked === true;
			row.appendChild(input);
			var text = document.createElement('span');
			mxUtils.write(text, labelText);
			row.appendChild(text);
			checkRow.appendChild(row);
			return input;
		};

		controls.isGroupBy = buildCheck('Group By', current.isGroupBy);
		controls.isRequired = buildCheck('必填', current.isRequired);
		controls.isVisible = buildCheck('可见', current.isVisible !== false);

		dialog.footer.appendChild(self.createActionButton('取消', 'Ghost', function()
		{
			dialog.close();
		}));
		dialog.footer.appendChild(self.createActionButton('保存', 'Primary', function()
		{
			currentMappings[mappingIndex] = normalizeMapping({
				aggregateFunc: controls.aggregateFunc.value,
				exprText: controls.exprText.value,
				exprType: controls.exprType.value,
				id: current.id,
				isGroupBy: controls.isGroupBy.checked === true,
				isRequired: controls.isRequired.checked === true,
				isVisible: controls.isVisible.checked === true,
				orderNo: parseInt(controls.orderNo.value, 10),
				sourceCellId: controls.sourceCell.value,
				sourceField: controls.sourceField.value,
				sourceTableScope: controls.sourceScope.value,
				targetField: controls.targetField.value,
				targetLabel: controls.targetLabel.value,
				width: parseInt(controls.width.value, 10)
			}, scope);
			currentMappings = resequenceMappings(currentMappings, true);
			scopes[scope] = currentMappings;
			saveScopes(scopes.main, scopes.detail, scopes.grid);
			dialog.close();
		}));
	};

	var renderMappingGroup = function(parent, groupTitle, scope, sourceScope)
	{
		var scopes = readScopes();
		var mappings = scopes[scope];
		var group = document.createElement('div');
		group.className = 'geFunctionMappingGroup';
		parent.appendChild(group);

		var header = document.createElement('div');
		header.className = 'geFunctionMappingGroupHeader';
		group.appendChild(header);

		var titleWrap = document.createElement('div');
		titleWrap.className = 'geFunctionMappingGroupTitle';
		mxUtils.write(titleWrap, groupTitle);
		header.appendChild(titleWrap);

		var count = document.createElement('span');
		count.className = 'geFunctionMappingGroupCount';
		mxUtils.write(count, String(mappings.length));
		header.appendChild(count);

		var actionWrap = document.createElement('div');
		actionWrap.className = 'geFunctionItemActions';
		header.appendChild(actionWrap);
		actionWrap.appendChild(self.createActionButton('添加映射', 'Primary', function()
		{
			openMappingPickerDialog(scope, sourceScope);
		}));

		var list = document.createElement('div');
		list.className = 'geFunctionMappingList';
		group.appendChild(list);

		if (mappings.length === 0)
		{
			var empty = document.createElement('div');
			empty.className = 'geFunctionBindEmpty';
			mxUtils.write(empty, '暂无配置');
			list.appendChild(empty);
			return;
		}

		for (var i = 0; i < mappings.length; i++)
		{
			(function(index)
			{
				var mapping = normalizeMapping(mappings[index], scope);
				var sourceChoice = findNodeChoice(mapping.sourceCellId);
				var item = document.createElement('div');
				item.className = 'geFunctionMappingItem';
				list.appendChild(item);

				var top = document.createElement('div');
				top.className = 'geFunctionMappingItemTop';
				item.appendChild(top);

				var title = document.createElement('div');
				title.className = 'geFunctionMappingItemTitle';
				mxUtils.write(title, (mapping.targetLabel || mapping.targetField || '未命名字段') + ' → ' + (mapping.targetField || '-'));
				top.appendChild(title);

				var meta = document.createElement('div');
				meta.className = 'geFunctionMappingItemMeta';
				mxUtils.write(meta, (sourceChoice != null ? sourceChoice.label : '未命名节点') + ' · ' + (mapping.sourceTableScope || '-') + ' · ' + (mapping.sourceField || '-'));
				item.appendChild(meta);

				var tags = document.createElement('div');
				tags.className = 'geFunctionMappingTags';
				item.appendChild(tags);
				[
					mapping.exprType || 'field',
					mapping.isGroupBy ? 'group by' : '',
					mapping.isRequired ? 'required' : '',
					mapping.isVisible === false ? 'hidden' : 'visible',
					'W ' + (mapping.width || 120),
					'#' + (mapping.orderNo || (index + 1))
				].forEach(function(text)
				{
					if (text === '')
					{
						return;
					}
					var tag = document.createElement('span');
					tag.className = 'geFunctionTag';
					mxUtils.write(tag, text);
					tags.appendChild(tag);
				});

				var actions = document.createElement('div');
				actions.className = 'geFunctionItemActions';
				item.appendChild(actions);
				actions.appendChild(self.createActionButton('编辑', 'Mini', function()
				{
					openMappingEditDialog(scope, index);
				}));
				if (scope !== 'grid')
				{
					actions.appendChild(self.createActionButton('加入Grid', 'Mini', function()
					{
						var latestScopes = readScopes();
						var gridMappings = latestScopes.grid.slice();
						var gridItem = normalizeMapping(mxUtils.extend({}, mapping, {
							id: '',
							mappingScope: 'grid',
							orderNo: gridMappings.length + 1
						}), 'grid');
						gridMappings.push(gridItem);
						latestScopes.grid = resequenceMappings(gridMappings, true);
						saveScopes(latestScopes.main, latestScopes.detail, latestScopes.grid);
					}));
				}
				if (index > 0)
				{
					actions.appendChild(self.createActionButton('上移', 'Mini', function()
					{
						var latestScopes = readScopes();
						var scopedMappings = latestScopes[scope].slice();
						var temp = scopedMappings[index - 1];
						scopedMappings[index - 1] = scopedMappings[index];
						scopedMappings[index] = temp;
						latestScopes[scope] = resequenceMappings(scopedMappings);
						saveScopes(latestScopes.main, latestScopes.detail, latestScopes.grid);
					}));
				}
				if (index < mappings.length - 1)
				{
					actions.appendChild(self.createActionButton('下移', 'Mini', function()
					{
						var latestScopes = readScopes();
						var scopedMappings = latestScopes[scope].slice();
						var temp = scopedMappings[index + 1];
						scopedMappings[index + 1] = scopedMappings[index];
						scopedMappings[index] = temp;
						latestScopes[scope] = resequenceMappings(scopedMappings);
						saveScopes(latestScopes.main, latestScopes.detail, latestScopes.grid);
					}));
				}
				actions.appendChild(self.createActionButton('删除', 'Danger', function()
				{
					var latestScopes = readScopes();
					var scopedMappings = latestScopes[scope].slice();
					scopedMappings.splice(index, 1);
					latestScopes[scope] = resequenceMappings(scopedMappings);
					saveScopes(latestScopes.main, latestScopes.detail, latestScopes.grid);
				}));
			})(i);
		}
	};

	var renderMappingSection = function()
	{
		var mappingSectionState = self.createSection('字段映射', '默认列表编辑，高级模式仅作备用');
		panel.appendChild(mappingSectionState.section);
		renderMappingGroup(mappingSectionState.body, '主字段映射', 'main', 'main');
		renderMappingGroup(mappingSectionState.body, '明细字段映射', 'detail', 'detail');
		renderMappingGroup(mappingSectionState.body, 'Grid 配置', 'grid', 'main');

		var advancedKey = cell.id + '_advancedMappings';
		ui.functionFlowAdvancedExpanded = ui.functionFlowAdvancedExpanded || {};
		mappingSectionState.header.appendChild(self.createActionButton(ui.functionFlowAdvancedExpanded[advancedKey] ? '收起高级 JSON' : '高级 JSON', 'Ghost', function()
		{
			ui.functionFlowAdvancedExpanded[advancedKey] = !ui.functionFlowAdvancedExpanded[advancedKey];
			ui.format.refresh();
		}));

		if (ui.functionFlowAdvancedExpanded[advancedKey] === true)
		{
			var scopes = readScopes();
			self.addJsonField(mappingSectionState.body, '主字段映射 JSON', JSON.stringify(scopes.main, null, 2), function(parsed)
			{
				saveScopes(resequenceMappings(parsed || [], true), scopes.detail, scopes.grid);
			}, '[{"targetField":"bill_no"}]');
			self.addJsonField(mappingSectionState.body, '明细字段映射 JSON', JSON.stringify(scopes.detail, null, 2), function(parsed)
			{
				saveScopes(scopes.main, resequenceMappings(parsed || [], true), scopes.grid);
			}, '[{"targetField":"qty"}]');
			self.addJsonField(mappingSectionState.body, 'Grid 配置 JSON', JSON.stringify(scopes.grid, null, 2), function(parsed)
			{
				saveScopes(scopes.main, scopes.detail, resequenceMappings(parsed || [], true));
			}, '[{"targetField":"bill_no"}]');
		}
	};

	var renderPreviewSection = function()
	{
		var previewSectionState = self.createSection('SQL 预览', null);
		panel.appendChild(previewSectionState.section);
		previewSectionState.header.appendChild(self.createActionButton('重新生成预览', 'Primary', function()
		{
			if (ui.notifyFunctionFlowGraphChange != null)
			{
				ui.notifyFunctionFlowGraphChange();
			}
		}));
		self.addCodeBlock(previewSectionState.body, 'sourceSql', preview.sourceSql || '');
		self.addCodeBlock(previewSectionState.body, 'detailSql', preview.detailSql || '');
		self.addCodeBlock(previewSectionState.body, 'gridJson', JSON.stringify(Array.isArray(preview.gridJson) ? preview.gridJson : [], null, 2));

		var validationSection = document.createElement('div');
		validationSection.className = 'geFunctionValidationList';
		previewSectionState.body.appendChild(validationSection);
		if (Array.isArray(preview.validationMessages) && preview.validationMessages.length > 0)
		{
			for (var i = 0; i < preview.validationMessages.length; i++)
			{
				var item = document.createElement('div');
				item.className = 'geFunctionValidationItem';
				mxUtils.write(item, preview.validationMessages[i]);
				validationSection.appendChild(item);
			}
		}
		else
		{
			var empty = document.createElement('div');
			empty.className = 'geFunctionBindEmpty';
			mxUtils.write(empty, '当前没有校验警告');
			validationSection.appendChild(empty);
		}
	};

	renderModuleSection(true);
	renderNodeSummarySection();
};

/**
 * Adds the label menu items to the given menu and parent.
 */
DiagramFormatPanel.prototype.destroy = function()
{
	BaseFormatPanel.prototype.destroy.apply(this, arguments);
	
	if (this.gridEnabledListener)
	{
		this.editorUi.removeListener(this.gridEnabledListener);
		this.gridEnabledListener = null;
	}
};
