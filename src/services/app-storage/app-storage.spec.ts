// Copyright (c) 2017 Tracktunes Inc

import { AppStorage } from './app-storage';
import { isPositiveWholeNumber } from '../../models';

const WAIT_MSEC: number = 5,
      SOME_IDX: number = 9999;

let appStorage: AppStorage = null,
    savedTabIndex: number = -1;

describe('services/app-storage', () => {

    beforeEach(() => {
        appStorage = new AppStorage();
    });

    it('initializes', () => {
        expect(appStorage).not.toBeNull();
    });

    it('can read lastTabIndex or get default value', (done) => {
        appStorage.get('lastTabIndex').then(
            (idx: number) => {
                savedTabIndex = idx;
                expect(isPositiveWholeNumber(idx)).toBe(true);
                done();
            }
        );
    });

    it('can update lastTabIndex to ' + SOME_IDX, (done) => {
        appStorage.set('lastTabIndex', SOME_IDX);
        done();
    });

    it('can get lastTabIndex as ' + SOME_IDX, (done) => {
        appStorage.get('lastTabIndex').then(
            (prop: any) => {
                expect(prop).toBe(SOME_IDX);
                done();
            });
    });

    it('can update lastTabIndex back to what it was originally', (done) => {
        appStorage.set('lastTabIndex', savedTabIndex);
        done();
    });

    it('can get lastTabIndex back to what it was originally', (done) => {
        appStorage.get('lastTabIndex').then(
            (prop: any) => {
                expect(prop).toBe(savedTabIndex);
                done();
            });
    });

});
