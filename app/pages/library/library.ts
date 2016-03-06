import {Page, Platform} from 'ionic-angular';
import {LocalDB} from '../../providers/local-db';
import {AppState} from '../../providers/app-state';


@Page({
    templateUrl: 'build/pages/library/library.html'
})
export class LibraryPage {
    private localDB: LocalDB;
    private folderPath: string = '/';
    private folderItems: Object[] = [];
    constructor(private platform: Platform, private appState: AppState) {
        this.localDB = this.appState.db;
        
        this.localDB.getItemsByParentKey(
            this.appState.lastViewedFolderKey,
            (data: any) => {
                this.folderItems.push(data);
                if (data.parentKey === this.appState.db.dbNoKey) {
                    this.folderPath = '/';
                }
                console.dir(data);
            }
        );
    }
}
