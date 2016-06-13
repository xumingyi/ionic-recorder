// Copyright (c) 2016 Tracktunes Inc

import {
    Component
} from '@angular/core';

import {
    NavController
} from 'ionic-angular';

import {
    AppState,
    LastPageVisited
} from '../../providers/app-state/app-state';

import {
    RecordPage
} from '../record/record';

import {
    LibraryPage
} from '../library/library';

import {
    SettingsPage
} from '../settings/settings';

import {
    AboutPage
} from '../about/about';

/**
 * @name LoadingPage
 * @description
 * Page that's displayed while we load things at app's start.
 */
@Component({
    templateUrl: 'build/pages/loading/loading.html'
})
export class LoadingPage {
    private nav: NavController;
    private appState: AppState;

    constructor(nav: NavController, appState: AppState) {
        console.log('constructor(): LoadingPage');
        this.nav = nav;
        this.appState = appState;

        this.appState.getProperty('lastPageVisited').subscribe(
            (lastPageVisited: LastPageVisited) => {
                switch (lastPageVisited) {
                    case LastPageVisited.Record:
                        this.nav.setRoot(RecordPage);
                        break;
                    case LastPageVisited.Library:
                        this.nav.setRoot(LibraryPage);
                        break;
                    case LastPageVisited.Settings:
                        this.nav.setRoot(SettingsPage);
                        break;
                    case LastPageVisited.About:
                        this.nav.setRoot(AboutPage);
                        break;
                }
            }
        ); // this.appState.getProperty('lastPageVisited').subscribe(
    }
}
