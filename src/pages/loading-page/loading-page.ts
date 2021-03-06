// Copyright (c) 2017 Tracktunes Inc

import { Component } from '@angular/core';
import { AppFilesystem } from '../../services';

/**
 * Initial empty page while loading. Not sure why this is useful -DT
 * @class LoadingPage
 */
@Component({
    selector: 'loading-page',
    templateUrl: 'loading-page.html'
})
export class LoadingPage {
    public appFilesystem: AppFilesystem;

    /**
     * @constructor
     */
    constructor(appFilesystem: AppFilesystem) {
        console.log('constructor()');
        // preload appFilesystem as early as possible by injecting it here
        this.appFilesystem = appFilesystem;
    }
}
