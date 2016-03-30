// Copyright (c) 2016 Tracktunes Inc

import {Component, Input, OnChanges, SimpleChange} from 'angular2/core';
import {IONIC_DIRECTIVES} from 'ionic-angular';
import {msec2time} from '../../providers/utils/utils';
import {MasterClock} from '../../providers/master-clock/master-clock';


const AUDIO_PLAYER_CLOCK_FUNCTION = 'audio-player-clock-function';


/**
 * @name AudioPlayer
 * @description
 * An LED lights display. LEDs are displayed either dark (off) or lit up
 * (on), depending on where 'value' is in the interval ['min', 'max'].
 */
@Component({
    selector: 'audio-player',
    templateUrl: 'build/components/audio-player/audio-player.html',
    directives: [IONIC_DIRECTIVES]
})
export class AudioPlayer implements OnChanges {
    @Input() private title: string;
    @Input() private url: string;
    @Input() private duration: number;
    private time: number;
    private hidden: boolean = true;
    private playPauseButtonIcon: string = 'play';
    private audioElement: HTMLAudioElement;
    private masterClock: MasterClock = MasterClock.Instance;
    private progressMax: number = 0;
    private progressValue: number = 0;
    constructor() {
        console.log('constructor():AudioPlayer');
    }

    ngOnInit() {
        this.audioElement = <HTMLAudioElement>(
            document.getElementById('audio-player-audio-tag')
        );

        this.audioElement.addEventListener('ended', () => {
            console.log('AUDIO ENDED');
            this.playPauseButtonIcon = 'play';
            this.masterClock.removeFunction(AUDIO_PLAYER_CLOCK_FUNCTION);
            this.time = this.duration;
            this.progressValue = this.time;
        });
    }


    show() {
        this.hidden = false;
    }

    hide() {
        this.hidden = true;
    }
    
    formatTime(time: number) {
        if (time === undefined) {
            return '00:00'; 
        }
        return msec2time(time).replace('00:00:', '');
    }

    play() {
        this.audioElement.play();
        console.log('audioElement.duration: ' + this.audioElement.duration);

        this.masterClock.addFunction(AUDIO_PLAYER_CLOCK_FUNCTION, () => {
            this.time = this.audioElement.currentTime * 1000.0;
            this.progressValue = this.time;
        });

        this.playPauseButtonIcon = 'pause';
    }

    pause() {
        this.audioElement.pause();
        this.masterClock.removeFunction(AUDIO_PLAYER_CLOCK_FUNCTION);
        this.playPauseButtonIcon = 'play';
    }

    onClickPlayPauseButton() {
        console.log('onClickPlayPauseButton()');

        if (this.playPauseButtonIcon === 'play') {
            this.play();
        }
        else {
            this.pause();
        }
    }

    onClickCloseButton() {
        // next line is the trick discussed here
        // https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/ ...
        //     ... Using_HTML5_audio_and_video
        this.masterClock.removeFunction(AUDIO_PLAYER_CLOCK_FUNCTION);
        this.url = '';
        this.audioElement.src = '';
        this.hide();
    }

    ngOnChanges(changeRecord: { [propertyName: string]: SimpleChange }) {
        if (changeRecord['title']) {
            console.log('AudioPlayer:ngOnChanges(): title: ' + this.title);
            if (this.title !== undefined) {
                this.show();
            }
        }
        if (changeRecord['url']) {
            console.log('AudioPlayer:ngOnChanges(): url: ' + this.url);
            if (this.url !== undefined) {
                this.audioElement.addEventListener('canplay', () => {
                    this.play();
                });
            }
        }
        if (changeRecord['duration']) {
            console.log('AudioPlayer:ngOnChanges(): duration: ' + this.duration);
            if (this.duration !== undefined) {
                this.progressMax = this.duration;
            }
        }
    }
}
