// Copyright (c) 2017 Tracktunes Inc

import {
    /* tslint:disable */
    ElementRef,
    Renderer,
    /* tslint:enable */
    Component,
    EventEmitter,
    Input,
    Output
} from '@angular/core';

/**
 * Component: A progress bar that can be clicked to change the
 * progress location, such as the one used in the youtube or other
 * video or audio players to control and visualize media playback.
 * @class ProgressSlider
 */
@Component({
    selector: 'progress-slider',
    templateUrl: 'progress-slider.html'
})
export class ProgressSlider {
    @Input() public progress: number;
    @Output() public change: EventEmitter<any>;
    @Output() public changeEnd: EventEmitter<any>;

    private element: ElementRef;
    private renderer: Renderer;

    private trackWidthRange: { start: number, end: number };
    private freeMouseUpListener: Function;
    private freeMouseMoveListener: Function;

    constructor(
        element: ElementRef,
        renderer: Renderer
    ) {
        console.log('constructor()');
        this.element = element;
        this.renderer = renderer;
        this.progress = 0;
        this.change = new EventEmitter();
        this.changeEnd = new EventEmitter();
    }

    /**
     *
     */
    public progressPercent(): string {
        return (100.0 * this.progress).toString() + '%';
    }

    /**
     *
     */
    public remainingPercent(): string {
        return (100.0 - 100.0 * this.progress).toString() + '%';
    }

    /**
     *
     */
    private getTrackWidthRange(): { start: number, end: number } {
        const
        progressSliderContainerElement: Element =
            document.getElementById('progress-slider-container'),
        styleDeclaration: CSSStyleDeclaration =
            getComputedStyle(progressSliderContainerElement, null),
        offsetLeft: number = this.element.nativeElement.offsetLeft,
        widthStyle: String = styleDeclaration.getPropertyValue('width'),
        paddingLeftStyle: string =
            styleDeclaration.getPropertyValue('padding-left'),
        width: number = parseFloat(widthStyle.replace('px', '')),
        paddingLeft: number = parseFloat(paddingLeftStyle.replace('px', ''));
        return {
            start: offsetLeft + paddingLeft,
            end: offsetLeft + width - paddingLeft
        };
    }

    /**
     *
     */
    private computeProgress(
        clientX: number,
        range: { start: number, end: number }
    ): number {
        // the next if-statement fixes a quirk observed in desktop Chrome
        // where the ondrag event always ends up with a clientX value of 0
        // as its last emitted value, even when that's clearly not the last
        // location of dragging
        if (clientX === 0) {
            return 0;
        }

        const rangeX: number = range.end - range.start,
              clickRelativeX: number = clientX - range.start;

        if (clickRelativeX < 0) {
            // clickRelativeX = 0;
            return 0.0;
        }

        if (clickRelativeX > rangeX) {
            // clickRelativeX = rangeX;
            return 1.0;
        }
        return clickRelativeX / rangeX;
    }

    /**
     *
     */
    private jumpToPosition(
        clientX: number,
        range: { start: number, end: number }
    ): void {
        this.progress = this.computeProgress(clientX, this.trackWidthRange);
        // console.log('JUMP TO POSITION: ' + this.progress);
        // console.log('JUMP TO POSITION: ' + clientX);
        // console.log('JUMP TO POSITION: ' + this.trackWidthRange);
        this.change.emit(this.progress);
        // this.detectChanges();
    }

    /**
     *
     */
    public onSliderMouseDown(event: MouseEvent): void {
        console.log('onSliderMouseDown ' + event.clientX);

        this.trackWidthRange = this.getTrackWidthRange();

        this.jumpToPosition(event.clientX, this.trackWidthRange);

        // renderer.listenGlobal() returns a function to free up
        // the listener it sets up. here we set up a listener on each
        // mousedown and we free up the listener on the subsequent
        // mouseup - this way a listener is only used when it really
        // needs to listen but when it does not need to listen we free
        // it up so that we do not have too many event listeners around.

        this.freeMouseUpListener =
            this.renderer.listenGlobal(
                'document',
                'mouseup',
                (mouseEvent: MouseEvent) => {
                    this.onMouseUp(mouseEvent);
                });

        this.freeMouseMoveListener =
            this.renderer.listenGlobal(
                'document',
                'mousemove',
                (mouseEvent: MouseEvent) => {
                    this.onMouseMove(mouseEvent);
                });
    }

    /**
     *
     */
    public onMouseUp(event: MouseEvent): void {
        // console.log('onMouseUp()');
        // free up the listening to mouse up from<body>now that it happened
        // until the next time we click on the progress-bar
        this.freeMouseUpListener();
        this.freeMouseMoveListener();
        this.progress =
            this.computeProgress(event.clientX, this.trackWidthRange);
        // we comment out the emit below because touchEnd happens in
        // desktop browsers so we get a double firing of this event.
        // we'll keep the one there (touchEnd), comment out the one here.
        this.changeEnd.emit(this.progress);
        console.log('onMouseUp(): changeEnd.emit(' + this.progress + ')');
        // this.detectChanges();
    }

    /**
     *
     */
    public onMouseMove(event: MouseEvent): void {
        this.jumpToPosition(event.clientX, this.trackWidthRange);
    }

    /**
     *
     */
    public onSliderTouchMove(event: TouchEvent): void {
        event.preventDefault();
        this.jumpToPosition(event.touches[0].clientX, this.trackWidthRange);
        // console.log('T moving: '+ event.touches[0].clientX);
    }

    /**
     *
     */
    public onSliderTouchStart(event: TouchEvent): void {
        event.preventDefault();
        this.trackWidthRange = this.getTrackWidthRange();
        this.jumpToPosition(event.touches[0].clientX, this.trackWidthRange);
        console.log('ON SLIDER TOUCH START ---------------------------');
    }

    /**
     *
     */
    public onSliderTouchEnd(event: TouchEvent): void {
        // to understand the 'preventDefault()' call below, see
        // https://www.html5rocks.com/en/mobile/touchandmouse/
        event.preventDefault();
        console.log('onSliderTouchEnd(): changeEnd.emit(' +
                    this.progress.toFixed(2) + ')');

        // If we uncomment this block below, then in the browser we get
        // double-calls to the changeEnd event on mouseUp and touchEnd -
        // both get called... not sure if we need touchEnd at all,
        // commenting it out until we test on mobile. If mobile browser
        // handles the mouseUp event on touchEnd then we're all set and
        // can get rid of this function altogether. Otherwise, we'd have
        // to somehow make sure we don't get double event firings.
        // this.progress =
        //     this.computeProgress(
        //         event.touches[0].clientX,
        //         this.trackWidthRange);
        // console.log('onSliderTouchEnd(): Emit ChangeEnd w/progress: ' +
        //      this.progress);
        this.changeEnd.emit(this.progress);
        // this.detectChanges();
    }
}
