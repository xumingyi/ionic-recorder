// Copyright (c) 2016 Tracktunes Inc

import {Page, NavController, Modal, Alert} from 'ionic-angular';
import {LocalDB, TreeNode, DataNode, ParentChild, DB_KEY_PATH}
from '../../providers/local-db/local-db';
import {AppState, ROOT_FOLDER_NAME} from '../../providers/app-state/app-state';
import {AddFolderPage} from '../add-folder/add-folder';
import {AudioPlayer} from '../../components/audio-player/audio-player';


/**
 * @name LibraryPage
 * @description
 * The page with a file/folder interface to all your recorded files. AddFolderPage
 * music organizer.
 */
@Page({
    templateUrl: 'build/pages/library/library.html',
    directives: [AudioPlayer]
})
export class LibraryPage {
    private folderNode: TreeNode = null;
    private folderItems: { [id: string]: TreeNode; } = {};
    private selectedNodes: { [id: string]: TreeNode; } = {};
    private localDB: LocalDB = LocalDB.Instance;
    private appState: AppState = AppState.Instance;
    private totalSelectedCounter: number = 0;
    private unfiledFolderKey: number;
    private playerTitle: string;
    private playerBlob: Blob;

    /**
     * @constructor
     * @param {NavController} nav
     */
    constructor(private nav: NavController) {
        console.log('constructor():LibraryPage');
    }

    /**
     * Called first time the graphics are initialized
     * https://webcake.co/page-lifecycle-hooks-in-ionic-2/
     * @returns {void}
     */
    onPageDidEnter() {
        // switch folders, via AppState
        this.appState.getLastViewedFolderKey().subscribe(
            (lastViewedFolderKey: number) => {
                // this is it!  here's where we enter the last viewed folder
                this.switchFolder(lastViewedFolderKey, false);
                this.appState.getProperty('selectedNodes').subscribe(
                    (selectedNodes: { [id: string]: TreeNode }) => {
                        this.selectedNodes = selectedNodes;
                        if (!selectedNodes) {
                            alert('no selected nodes! ' + selectedNodes);
                        }
                        this.appState.getProperty('unfiledFolderKey')
                            .subscribe(
                            (unfiledFolderKey: number) => {
                                this.unfiledFolderKey = unfiledFolderKey;
                            },
                            (error: any) => {
                                alert('in getProperty: ' + error);
                            }
                            ); // getProperty().subscribe(
                    },
                    (error: any) => {
                        alert('in getProperty: ' + error);
                    }
                ); // getProperty().subscribe(
            },
            (error: any) => {
                alert('in getProperty: ' + error);
            }
        ); // getProperty().subscbribe(
    }

    /**
     * Computes a string representation of folder path (tree node path)
     * @returns {string} folder path, represented as a string
     */
    getPath() {
        let path: string = this.folderNode.path + '/' + this.folderNode.name,
            rootPath: string = '/' + ROOT_FOLDER_NAME;
        if (path === rootPath) {
            return '/';
        }
        else {
            return path.slice(rootPath.length);
        }
    }

    /**
     * Tells UI if the go to parent button should be disabled
     * @returns {boolean} whether goToParent button should be disabled
     */
    parentButtonDisabled() {
        return !this.folderNode || this.folderNode.path === '';
    }

    /**
     * Helper function to pop up questions and act upon user choice
     * @param {string} question
     * @param {string} button1Text
     * @param {()=>void} action1
     * @param {string} button2Text
     * @param {()=>void} action2
     * @returns {void}
     */
    alertAndDo(
        question: string,
        button1Text: string,
        action1: () => void,
        button2Text?: string,
        action2?: () => void) {

        let alert = Alert.create();

        alert.setTitle(question);

        if (!action2) {
            alert.addButton('Cancel');
        }

        alert.addButton({
            text: button1Text,
            handler: data => {
                action1();
            }
        });

        if (action2) {
            alert.addButton({
                text: button2Text,
                handler: data => {
                    action2();
                }
            });
            alert.addButton('Cancel');
        }
        // TODO: check if we need the empty call to .then() here
        this.nav.present(alert).then();
    }

    /**
     * Moves items in DB and in UI when move button is clicked
     * @returns {void}
     */
    onClickMoveButton() {
    }

    /**
     * Moves items in DB and in UI when more button is clicked
     * @returns {void}
     */
    onClickMoreButton() {
    }

    /**
     * Used to tell UI the number of currently selected nodes
     * @returns {number} number of currently selected nodes
     */
    nSelectedNodes() {
        return Object.keys(this.selectedNodes).length;
    }

    /**
     * Returns dictionary of nodes selected in current folder
     * @returns {{ [id: string]: TreeNode; }} dictionary of nodes selected here
     */
    selectedNodesHere(): { [id: string]: TreeNode; } {
        let key: string,
            i: number,
            nodeHere: TreeNode,
            keyDict: { [id: string]: TreeNode; } = {},
            keys = Object.keys(this.selectedNodes);
        for (i = 0; i < keys.length; i++) {
            key = keys[i];
            nodeHere = this.folderItems[key];
            if (nodeHere) {
                keyDict[key] = nodeHere;
            }
        }
        return keyDict;
    }

    /**
     * Delete nodes from  UI and from local DB
     * @param {{ [id: string]: TreeNode; }} dictionary of nodes to delete
     * @returns {void}
     */
    deleteNodes(keyDict: { [id: string]: TreeNode; }) {
        let keys: string[] = Object.keys(keyDict),
            nNodes: number = keys.length;
        if (!nNodes) {
            alert('wow no way!');
        }
        this.alertAndDo(
            'Permanently delete ' + nNodes + ' item' +
            (nNodes > 1 ? 's?' : '?'),
            'Ok', () => {
                console.log('Library::deleteNodes(): deleting ' + nNodes +
                    ' selected items ...');
                this.localDB.deleteNodes(keyDict).subscribe(
                    () => {
                        let i: number,
                            bSelectionChanged = false,
                            key: string;

                        for (i = 0; i < nNodes; i++) {
                            key = keys[i];
                            // remove from this.folderNode.childOrder
                            this.folderNode.childOrder =
                                this.folderNode.childOrder.filter(
                                    (childKey: number) => {
                                        return childKey.toString() !== key;
                                    });
                            // remove from this.folderItems
                            if (this.folderItems[key]) {
                                delete this.folderItems[key];
                            }
                            // remove from this.selectedNodes
                            if (this.selectedNodes[key]) {
                                delete this.selectedNodes[key];
                                // remember that we've changed selection
                                bSelectionChanged = true;
                            }
                        } // for (i = 0; i < nNodes; i++) {
                        if (bSelectionChanged) {
                            this.appState.updateProperty('selectedNodes',
                                this.selectedNodes).subscribe(
                                () => {
                                    console.log('SUCCESS DELETING ALL');
                                }
                                );
                        }
                        else {
                            console.log('SUCCESS DELETING ALL');
                        }
                    }
                );
            });
    }

    /**
     * Checks if selected nodes are only in current folder, if not prompts user
     * for which nodes s/he wants to delete and proceedes with deletion
     * @returns {void}
     */
    checkIfDeletingInOtherFolders() {
        let nSelectedNodes = Object.keys(this.selectedNodes).length,
            selectedNodesHere: { [id: string]: TreeNode; } =
                this.selectedNodesHere(),
            nSelectedNodesHere = Object.keys(selectedNodesHere).length,
            nSelectedNodesNotHere = nSelectedNodes - nSelectedNodesHere;

        if (nSelectedNodes === 0) {
            // for the case of unselecting only Unfiled folder in the alert
            // above and nothing is left in selected.  otherwise this condition
            // should never be met.
            return;
        }

        if (nSelectedNodesNotHere) {
            if (nSelectedNodesHere) {
                this.alertAndDo([
                    'You have ', nSelectedNodesNotHere,
                    ' selected item',
                    nSelectedNodesNotHere > 1 ? 's' : '',
                    ' outside this folder. Do you want to delete all ',
                    nSelectedNodes, ' selected item',
                    nSelectedNodes > 1 ? 's' : '',
                    ' or only the ', nSelectedNodesHere,
                    ' item', nSelectedNodesHere > 1 ? 's' : '',
                    ' here?'].join(''),
                    'Delete all (' + nSelectedNodes + ')',
                    () => {
                        console.log('no action');
                        this.deleteNodes(this.selectedNodes);
                    },
                    'Delete only here (' + nSelectedNodesHere + ')',
                    () => {
                        console.log('yes action');
                        this.deleteNodes(selectedNodesHere);
                    }
                );
            }
            else {
                // nothing selected in this folder, but stuff selected outside
                this.deleteNodes(this.selectedNodes);
            }
        }
        else {
            // all selected nodes are in this folder
            this.deleteNodes(selectedNodesHere);
        }
    }

    /**
     * Deletes selected nodes when delete button gets clicked
     * @returns {void}
     */
    onClickDeleteButton() {
        if (this.selectedNodes[this.unfiledFolderKey]) {

            this.alertAndDo([
                'The Unfiled folder is selected for deletion, ',
                'but the Unfiled folder cannot be deleted. Unselect it ',
                'and delete the rest?'].join(''),
                'Yes',
                () => {
                    delete this.selectedNodes[this.unfiledFolderKey];
                    this.checkIfDeletingInOtherFolders();
                }
            );
        }
        else {
            this.checkIfDeletingInOtherFolders();
        }
    }

    /**
     * Initiates sharing selected items when share button gets clicked
     * @returns {void}
     */
    moreButtonDisabled() {
        return false;
    }

    /**
     * UI callback for sharing the selected items when share button is clicked
     * @returns{void}
     */
    onClickSharebutton() {

    }

    /**
     * Determine whether the move button should be disabled in the UI
     * @returns {void}
     */
    moveButtonDisabled() {
        return false;
    }

    /**
     * Determine whether the delete button should be disabled in the UI
     * @returns {void}
     */
    deleteButtonDisabled() {
        // return this.selectedNodes[this.unfiledFolderKey];
        return false;
    }

    /**
     * Switch to a new folder
     * @param {number} key of treenode corresponding to folder to switch to
     * @param {boolean} whether to update app state 'lastFolderViewed' property
     * @returns {void}
     */

    // switch to folder whose key is 'key'
    // if updateState is true, update the app state
    // property 'lastViewedFolderKey'
    switchFolder(key: number, updateState: boolean) {
        if (!this.localDB.validateKey(key)) {
            alert('switchFolder -- invalid key!');
            return;
        }
        /*
        TODO: without the alert we may want the return statement here
        if (this.folderNode && this.folderNode[DB_KEY_PATH] === key) {
            // we're already in that folder
            alert('why switch twice in a row to the same folder?');
            return;
        }
        */
        // console.log('switchFolder(' + key + ', ' + updateState + ')');

        // for non-root folders, we set this.folderNode here
        this.localDB.readNode(key).subscribe(
            (folderNode: TreeNode) => {
                if (folderNode[DB_KEY_PATH] !== key) {
                    alert('in readNode: key mismatch');
                }
                // we read all child nodes of the folder we're
                // switching to in order to fill up this.folderItems
                let newFolderItems: { [id: string]: TreeNode } = {};
                this.localDB.readChildNodes(folderNode).subscribe(
                    (childNodes: TreeNode[]) => {
                        this.folderItems = {};
                        // we found all children of the node we're
                        // traversing to (key)
                        for (let i in childNodes) {
                            let childNode: TreeNode = childNodes[i],
                                childKey: number = childNode[DB_KEY_PATH];
                            newFolderItems[childKey] = childNode;
                        } // for
                        this.folderNode = folderNode;
                        this.folderItems = newFolderItems;
                    },
                    (error: any) => {
                        alert('in readChildNodes: ' + error);
                    }
                ); // readChildNodes().subscribe(
            },
            (error: any) => {
                alert('in readNode: ' + error);
            }
        );

        // update last viewed folder state in DB
        if (updateState) {
            this.appState.updateProperty('lastViewedFolderKey', key)
                .subscribe(
                () => { },
                (error: any) => {
                    alert('in updateProperty: ' + error);
                }
                ); // updateProperty().subscribe
        }
    }

    /**
     * Used by UI to determine whether 'node' is selected
     * @param {TreeNode} node about which we ask if it's selected
     * @returns {boolean} whether 'node' is selected
     */
    isSelected(node: TreeNode) {
        return this.selectedNodes[node[DB_KEY_PATH]];
    }

    /**
     * UI calls this when the # of selected items badge is clicked
     * @returns {void}
     */
    onClickTotalSelected() {
        this.totalSelectedCounter++;
    }

    /**
     * UI calls this when a UI item gets checked
     * @param {TreeNode} node corresponding to UI item that just got checked
     * @returns {void}
     */
    onClickCheckbox(node: TreeNode) {
        // reset the counter for flipping through selected nodes
        this.totalSelectedCounter = 0;

        let nodeKey: number = node[DB_KEY_PATH],
            isSelected: TreeNode = this.selectedNodes[nodeKey];

        if (isSelected) {
            // uncheck it
            delete this.selectedNodes[nodeKey];
        }
        else {
            // not selected, check it
            this.selectedNodes[nodeKey] = node;
        }

        // update state with new list of selected nodes
        this.appState.updateProperty('selectedNodes',
            this.selectedNodes).subscribe(
            () => { },
            (error: any) => {
                alert('in updateProperty: ' + error);
            }
            ); // updateProperty().subscribe
    }

    /**
     * UI calls this when a list item (name) is clicked
     * @returns {void}
     */
    onClickListItem(node: TreeNode) {
        if (this.localDB.isFolderNode(node)) {
            // it's a folder! switch to it
            this.switchFolder(node[DB_KEY_PATH], true);
        }
        else {
            // it's not a folder, it's a blob!
            // here's where we initiate the player.
            // setting this.playerTitle triggers the audio
            // player to make itself visible
            this.playerTitle = node.name;
            this.localDB.readNodeData(node).subscribe(
                (dataNode: DataNode) => {
                    // dataNode.data is the Blob object to play
                    // setting this.playerBlob triggers the audio
                    // player ngOnChanges to load/play the blob
                    this.playerBlob = dataNode.data;
                }
            ); // readNodeData(node).subscribe(
        } // if (this.localDB.isFolderNode(node)) { .. else { ..
    }

    /**
     * UI calls this when the goToParent button is clicked
     * @returns {void}
     */
    onClickParentButton() {
        if (this.folderNode) {
            this.switchFolder(this.folderNode.parentKey, true);
        }
    }

    /**
     * UI calls this when the new folder button is clicked
     * @returns {void}
     */
    onClickAddButton() {
        // note we consider the current folder (this.folderNode) the parent
        let addFolderModal = Modal.create(AddFolderPage, {
            parentPath: this.getPath(),
            parentItems: this.folderItems
        });

        this.nav.present(addFolderModal);

        addFolderModal.onDismiss((folderName: string) => {
            if (folderName) {
                // data is new folder's name returned from addFolderModal
                console.log('got folderName back: ' + folderName);
                // create a node for added folder childNode
                this.localDB.createFolderNode(folderName,
                    this.folderNode[DB_KEY_PATH]).subscribe(
                    (parentChild: ParentChild) => {
                        let childNode = parentChild.child,
                            parentNode = parentChild.parent,
                            childNodeKey: number = childNode[DB_KEY_PATH];
                        console.log('childNode: ' + childNode +
                            ', parentNode: ' + parentNode);
                        // update folder items dictionary of this page
                        this.folderItems[childNodeKey] = childNode;
                        this.folderNode = parentNode;
                    },
                    (error: any) => {
                        alert('in createFolderNode: ' + error);
                    }
                    ); // createFolderNode().subscribe(
            }
            else {
                console.log('you canceled the add-folder');
                // assume cancel
                return;
            }
        });
    }

    /**
     * UI calls this when the info button (of selected items) clicked
     * @returns {void}
     */
    onClickInfoButton() {
    }

    /**
     * Select all or no items in current folder, depending on 'all; argument
     * @params {boolean} if true, select all, if false, select none
     * @returns {void}
     */
    selectAllOrNoneInFolder(all: boolean) {
        // go through all folderItems
        // for each one, ask if it's in selectedNodes
        // for this to work, we need to make selectedNodes a dictionary
        let changed: boolean = false,
            i: number,
            key: string,
            folderItemsKeys: string[] = Object.keys(this.folderItems),
            itemNode: TreeNode,
            itemKey: number;
        for (i = 0; i < folderItemsKeys.length; i++) {
            key = folderItemsKeys[i];
            itemNode = this.folderItems[key];
            itemKey = itemNode[DB_KEY_PATH];

            let isSelected: TreeNode = this.selectedNodes[itemKey];

            if (all && !isSelected) {
                changed = true;
                // not selected, check it
                this.selectedNodes[itemKey] = itemNode;
            }
            if (!all && isSelected) {
                changed = true;
                // selected, uncheck it
                delete this.selectedNodes[itemKey];
            }
        }
        if (changed) {
            // update state with new list of selected nodes
            this.appState.updateProperty('selectedNodes',
                this.selectedNodes).subscribe(
                () => { },
                (error: any) => {
                    alert('in updateProperty: ' + error);
                }
                ); // updateProperty().subscribe
        }
    }

    /**
     * Select all items in current folder
     * @returns {void}
     */
    selectAllInFolder() {
        this.selectAllOrNoneInFolder(true);
    }

    /**
     * Get rid of selection on all nodes in current folder
     * @returns {void}
     */
    selectNoneInFolder() {
        this.selectAllOrNoneInFolder(false);
    }

    /**
     * Initiates select button action when that button is clicked
     * @returns {void}
     */
    onClickSelectButton() {
        this.alertAndDo(
            'Select which, in<br> ' + this.folderNode.name,
            'All',
            () => {
                this.selectAllInFolder();
            },
            'None',
            () => {
                this.selectNoneInFolder();
            });
    }
}