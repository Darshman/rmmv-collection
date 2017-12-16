//=============================================================================
// Heretics Plugins - Message Item
// HS_MessageItem.js

var HS = HS || {};
HS.MI = HS.MI || {};

//=============================================================================

var Imported = Imported || {};
Imported.HS_MessageItem = true;

//=============================================================================
/*:
 * @plugindesc v1.0 Allows for items that when used in the menu, display an
 * embedded text message in a new window.
 * @author The_Darshman
 *
 * @param ---General---
 *
 * @param Message Box X
 * @parent ---General---
 * @desc The x position of the message box that will appear. Input a number
 * or javascript evaluation that returns one.
 * @default Math.floor(Graphics.width * 0.1)
 *
 * @param Message Box Y
 * @parent ---General---
 * @desc The y position of the message box that will appear. Input a number
 * or javascript evaluation that returns one.
 * @default Math.floor(Graphics.height * 0.1)
 *
 * @param Message Box Width
 * @parent ---General---
 * @desc The width of the message box that will appear. Input a number
 * or javascript evaluation that returns one.
 * @default Math.floor(Graphics.width * 0.8)
 *
 * @param Message Box Height
 * @parent ---General---
 * @desc The height of the message box that will appear. Input a number
 * or javascript evaluation that returns one.
 * @default Math.floor(Graphics.height * 0.8)
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * This plugin allows for items, that when used in the menu, bring up a
 * new window to display an in-menu message. If an item is given this
 * property, that item's other properties are ignored, and it can only be
 * used in the menu.
 *
 * ============================================================================
 * Notetags
 * ============================================================================
 *
 * You can use the following notetags to configure an item's display message.
 *
 * Item Notetags:
 *
 * <Item Message>
 * line
 * line
 * line
 * </Item Message>
 * Makes the item a message item that will display the message with the
 * lines you write. If used in tandem with the next notetag, this will
 * specify the text for page 0.
 *
 * <Item Message: Page x>
 * line
 * line
 * line
 * </Item Message>
 * Makes the item a message item that will display the message with the
 * lines you write on the page x. Pages start from 0.
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * Version 1.00:
 * - Finished plugin!
 *
 */
//=============================================================================

(function() {

"use strict";

//=============================================================================
// Parameter Variables
//=============================================================================

HS.Parameters = PluginManager.parameters('HS_MessageItem');
HS.Param = HS.Param || {};

HS.Param.MI_MessageBoxX 	 = String(HS.Parameters['Message Box X']);
HS.Param.MI_MessageBoxY 	 = String(HS.Parameters['Message Box Y']);
HS.Param.MI_MessageBoxWidth  = String(HS.Parameters['Message Box Width']);
HS.Param.MI_MessageBoxHeight = String(HS.Parameters['Message Box Height']);

//=============================================================================
// DataManager
//=============================================================================

HS.MI.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!HS.MI.DataManager_isDatabaseLoaded.call(this)) { 
		return false;
	} else {
		this.processHS_MINotetags($dataItems);
		return true;
	}
};

DataManager.processHS_MINotetags = function(group) {
	var note1 = /<(?:MESSAGE ITEM|ITEM MESSAGE)>/i;
	var note2 = /<\/(?:MESSAGE ITEM|ITEM MESSAGE)>/i;
	var note3 = /<(?:MESSAGE ITEM|ITEM MESSAGE):[ ]*(?:PAGE)[ ](\d+)>/i;
	for (var n = 1; n < group.length; n++) {
		var obj = group[n];
		var notedata = obj.note.split(/[\r\n]/);
		var evalMode = 0;
		var page = 0;
		obj.itemMessages = undefined;
		for (var i = 0; i < notedata.length; i++) {
			var line = notedata[i];
			if (line.match(note1)) {
				if (!obj.itemMessages) obj.itemMessages = [];
				obj.itemMessages[0] = '';
				evalMode = 1;
			} else if (line.match(note2)) {
				evalMode = 0;
				page = 0;
			} else if (line.match(note3)) {
				if (!obj.itemMessages) obj.itemMessages = [];
				page = parseInt(RegExp.$1);
				obj.itemMessages[page] = '';
				evalMode = 2;
			} else {
				if (evalMode == 1) {
					obj.itemMessages[0] = obj.itemMessages[0] + line + '\n';
				} else if (evalMode == 2) {
					obj.itemMessages[page] = obj.itemMessages[page] + line + '\n';
				}
			}
		}
		if (obj.itemMessages) {
			for (var i = 0; i < obj.itemMessages.length; i++) {
				if (obj.itemMessages[i] == null) obj.itemMessages[i] = "";
			}
		}
	}
};

//=============================================================================
// Game_BattlerBase
//=============================================================================

HS.MI.Game_BattlerBase_isOccasionOk = Game_BattlerBase.prototype.isOccasionOk;
Game_BattlerBase.prototype.isOccasionOk = function(item) {
	if (item.itemMessages) {
		return !$gameParty.inBattle() && (item.occasion == 0 || item.occasion == 2);
	} else {
		return HS.MI.Game_BattlerBase_isOccasionOk.call(this, item);
	}
};

//=============================================================================
// Window_ItemMessage
//=============================================================================

function Window_ItemMessage() {
	this.initialize(this, arguments);
}

Window_ItemMessage.prototype = Object.create(Window_Selectable.prototype);
Window_ItemMessage.prototype.constructor = Window_ItemMessage;

Window_ItemMessage.prototype.initialize = function() {
	var x = this.windowX();
	var y = this.windowY();
	var w = this.windowWidth();
	var h = this.windowHeight();
	this._currentText = [];
	this._page = 0;
	this._messages = undefined;
	Window_Selectable.prototype.initialize.call(this, x, y, w, h);
	this.openness = 0;
	this.resetScroll();
};

Window_ItemMessage.prototype.updateItem = function(item) {
	this._messages = item.itemMessages;
	this.initializePage();
	this.updateCurrentText();
	this.refresh();
};

Window_ItemMessage.prototype.updateCurrentText = function() {
	this.resetScroll();
	this._currentText = [];
	if (this._messages[this._page]) {
		this._currentText = this._messages[this._page].split(/\n/);
	}
	this.refresh();
};

Window_ItemMessage.prototype.initializePage = function() {
	this._page = 0;
	while (this._messages[this._page] == undefined) {
		this._page++;
		if (this._page >= this.maxPages()) this._page = 0;
		if (this._page == 0) break;
	}
};

Window_ItemMessage.prototype.processCursorMove = function() {
    if (this.isCursorMovable()) {
        if (Input.isRepeated('down')) {
            this.cursorDown(Input.isTriggered('down'));
        }
        if (Input.isRepeated('up')) {
            this.cursorUp(Input.isTriggered('up'));
        }
    }
	if (this.isOpenAndActive()) {
		if (Input.isRepeated('right')) {
			this.cursorRight(Input.isTriggered('right'));
		}
		if (Input.isRepeated('left')) {
			this.cursorLeft(Input.isTriggered('left'));
		}
	}
};

Window_ItemMessage.prototype.drawAllItems = function() {
    Window_Selectable.prototype.drawAllItems.call(this);
	var rect = this.itemRect(this.bottomRow());
	this.changeTextColor(this.systemColor());
	var current = this._page + 1;
	var text = "Page: " + current + "/" + this.maxPages();
	var y = this.contents.height - this.lineHeight();
	var w = this.contents.width;
	var h = this.lineHeight();
	this.contents.clearRect(0, y, w, h);
	this.drawText(text, 0, y, w, 'center');
	this.resetFontSettings();
};

Window_ItemMessage.prototype.drawItem = function(index) {
	if (!this._currentText[index]) return;
	var rect = this.itemRectForText(index);
	this.drawTextEx(this._currentText[index], rect.x, rect.y);
};

Window_ItemMessage.prototype.updateCursor = function() {};

Window_ItemMessage.prototype.onTouch = function() {
	var x = this.canvasToLocalX(TouchInput.x);
    var y = this.canvasToLocalY(TouchInput.y);
	var hitIndex = this.hitTest(x, y);
	if (hitIndex < 0 && this._stayCount >= 10) {
		if (y < this.padding) {
            this.scrollUp();
        } else if (y >= this.height - this.padding) {
            this.scrollDown();
        }
	}
};

Window_ItemMessage.prototype.isOkEnabled = function() {
    return false;
};

Window_ItemMessage.prototype.cursorDown = function(wrap) {
    this.scrollDown();
};

Window_ItemMessage.prototype.cursorUp = function(wrap) {
    this.scrollUp();
};

Window_ItemMessage.prototype.cursorRight = function(wrap) {
	wrap = false;
	SoundManager.playCursor();
    this.incrementPage();
};

Window_ItemMessage.prototype.cursorLeft = function(wrap) {
	wrap = false;
	SoundManager.playCursor();
    this.decrementPage();
};

Window_ItemMessage.prototype.maxItems = function() {
	return this._currentText.length;
};

Window_ItemMessage.prototype.maxPages = function() {
	return this._messages ? this._messages.length : 0;
};

Window_ItemMessage.prototype.incrementPage = function() {
	if (!this._messages) return;
	do {
		this._page++;
		if (this._page >= this.maxPages()) this._page = 0;
	} while (this._messages[this._page] == undefined);
	this.updateCurrentText();
};

Window_ItemMessage.prototype.decrementPage = function() {
	if (!this._messages) return;
	do {
		this._page--;
		if (this._page < 0) this._page = this.maxPages() - 1;
	} while (this._messages[this._page] == undefined);
	this.updateCurrentText();
};

Window_ItemMessage.prototype.windowX = function() {
	return eval(HS.Param.MI_MessageBoxX);
};

Window_ItemMessage.prototype.windowY = function() {
	return eval(HS.Param.MI_MessageBoxY);
};

Window_ItemMessage.prototype.windowWidth = function() {
	return eval(HS.Param.MI_MessageBoxWidth);
};

Window_ItemMessage.prototype.windowHeight = function() {
	return eval(HS.Param.MI_MessageBoxHeight);
};

//=============================================================================
// Scene_Item
//=============================================================================

HS.MI.Scene_Item_create = Scene_Item.prototype.create;
Scene_Item.prototype.create = function() {
	HS.MI.Scene_Item_create.call(this);
	this.createItemMessageWindow();
};

Scene_Item.prototype.createItemMessageWindow = function() {
	this._itemMessageWindow = new Window_ItemMessage();
    this._itemMessageWindow.setHandler('cancel', this.closeItemMessage.bind(this));
    this.addWindow(this._itemMessageWindow);
};

Scene_Item.prototype.openItemMessage = function(item) {
	this._itemMessageWindow.updateItem(item);
	this._itemMessageWindow.open();
	this._itemMessageWindow.activate();
	this._itemMessageWindow.select(0);
	this._itemWindow.deactivate();
};

Scene_Item.prototype.closeItemMessage = function() {
	this._itemMessageWindow.close();
	this._itemMessageWindow.deselect();
	this._itemMessageWindow.deactivate();
	this.activateItemWindow();
};

Scene_Item.prototype.determineItem = function() {
	var item = this.item();
	if (item.itemMessages) {
		this.playSeForItem();
		this.user().useItem(item);
		this._itemWindow.redrawCurrentItem();
		this.openItemMessage(item);
	} else {
		Scene_ItemBase.prototype.determineItem.call(this);
	}
};

//=============================================================================

})();

//=============================================================================
// End of File
//=============================================================================