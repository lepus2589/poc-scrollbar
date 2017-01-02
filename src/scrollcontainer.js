/**
 * If you're looking in this code, you usually want to know, how this works. It might look
 * some kind of messy, but the code itself is logically structured. If you don't get some
 * struct, just ask.
 */

import { ScrollView } from './scrollview';

/**
 * The scroll container represents the main element, which contains too long
 * content. It'll detect everything by itself and acts based on your configuration.
 * The visualization is not done here, it's done in the ScrollView
 */
export default class ScrollContainer {
    /**
     * Here is the main starting point. The constructor will set up all events and the
     * scrollView.
     * Warning: The container elements needs to serve as container for absolute elements.
     * To garantee this, the style is changed to position=relative if it's not already
     * relative or absolute.
     *
     * @param {HTMLElement} aElement The element that should be scrollable
     * @param {Object} [aOptions = {}] The provided options. For details see README.md
     */
    constructor(aElement, aOptions = {}) {
        // first save the given values
        this._container = aElement;
        this._options = aOptions;
        // then create a new scrollView, based on the ScrollContainers static property
        this._scrollView = new ScrollView(this, aOptions);

        // Then setup the event listeners, that help scrolling in the container. This is
        // done in a saved object, not as methods, so we can easily add and remove the
        // eventlisteners
        this._eventListener = {
            // on scroll just add the scroll delta to behave naturally
            wheel: (aEvent) => {
                // if the default is prevented, we ignore this event
                if (aEvent.defaultPrevented) {
                    return;
                }

                // else we store the old values
                const currentScrollTop = this._container.scrollTop;
                const currentScrollLeft = this._container.scrollLeft;

                // trigger the changing
                this.scrollTop(this._container.scrollTop + aEvent.deltaY);
                this.scrollLeft(this._container.scrollLeft + aEvent.deltaX);

                // and if something actually changed
                if (currentScrollTop !== this._container.scrollTop ||
                    currentScrollLeft !== this._container.scrollLeft
                ) {
                    // we call prevent default, so the browser and other scrollbars won't
                    // do anything
                    aEvent.preventDefault();
                }
            },
            // on touch see, if there is touch disabled, and if not, handle scroll like
            // most people know it
            touchstart: (aEvent) => {
                if (aEvent.defaultPrevented || aOptions.disableTouchScrollingOnContainer) {
                    return;
                }

                // save a pointer to the touch to track. This should help to support multitouch
                const touchToTrack = aEvent.which || 0;
                // and save temporary variables for the move calculation
                let tmpMoverX = aEvent.touches[touchToTrack].clientX;
                let tmpMoverY = aEvent.touches[touchToTrack].clientY;

                // then setup a move function pointer
                let tmpMovePointer = (aaEvent) => {
                    // which only tracks the correct touch
                    if (aaEvent.which !== touchToTrack) {
                        return;
                    }

                    // calculates the distance
                    const distanceX = tmpMoverX - aaEvent.touches[touchToTrack].clientX;
                    const distanceY = tmpMoverY - aaEvent.touches[touchToTrack].clientY;

                    tmpMoverX = aaEvent.touches[touchToTrack].clientX;
                    tmpMoverY = aaEvent.touches[touchToTrack].clientY;

                    // and triggers an update for scrollTop and scrollLeft
                    this.scrollTop(this._container.scrollTop + distanceY);
                    this.scrollLeft(this._container.scrollLeft + distanceX);
                };

                // finally setup a pointer to a touchend function handler
                let tmpEndPointer = (aaEvent) => {
                    // which only reacts to the correct touch
                    if (aaEvent.which !== touchToTrack) {
                        return;
                    }
                    // deregisters the event handlers
                    document.body.removeEventListener('touchmove', tmpMovePointer);
                    document.body.removeEventListener('touchend', tmpEndPointer);
                    document.body.removeEventListener('touchleave', tmpEndPointer);

                    // and nulls the pointer for freeing memory
                    tmpMovePointer = null;
                    tmpEndPointer = null;
                };

                // and finally add the event handlers, so this will actually work correctly
                document.body.addEventListener('touchmove', tmpMovePointer);
                document.body.addEventListener('touchend', tmpEndPointer);
                document.body.addEventListener('touchleave', tmpEndPointer);
            },
        };

        // then setup an interval, that executes the interval handler and checks the container
        // for changes
        this._intervalPointer = window.setInterval(
            this._createIntervalHandler(), aOptions.checkInterval || 300);

        // then go and set the style for the container element. It's important to disable overflow
        // and set the container to some style, that acts as container for absolute elements
        this._container.style.overflow = 'hidden';
        const currentPositionStyle = window.getComputedStyle(this._container, null).getPropertyValue('position');
        if (currentPositionStyle !== 'absolute' && currentPositionStyle !== 'relative') {
            this._container.style.position = 'relative';
        }

        // then attach all event handlers to the container
        Object.keys(this._eventListener).forEach((aKey) => {
            this._container.addEventListener(aKey, this._eventListener[aKey]);
        });

        this._scrollTop = 0;
        this._scrollLeft = 0;
        // and tell the scrollView to execute a parentUpdated
        this._scrollView.parentUpdated();
    }

    /**
     * This function creates a closure, that handles update checks.
     *
     * @private
     * @return {function} An interval handler to call at each tick
     */
    _createIntervalHandler() {
        // setup some variables, that serve as cache for the closure
        let containerHeight = this._container.clientHeight;
        let containerWidth = this._container.clientWidth;
        let scrollHeight = this._container.scrollHeight;
        let scrollWidth = this._container.scrollWidth;

        // then return the closure function
        return () => {
            // search for the root element of this element
            let potentialRootElement = this._container.parentElement;
            while (potentialRootElement !== null &&
                potentialRootElement !== undefined &&
                potentialRootElement !== document.body
            ) {
                potentialRootElement = potentialRootElement.parentElement;
            }

            const oldScrollTop = this._scrollTop;
            const oldScrollLeft = this._scrollLeft;

            this._scrollView.scrollTopUpdated(0);
            this._scrollView.scrollLeftUpdated(0);

            // if there is no root element
            if (potentialRootElement === null || potentialRootElement === undefined) {
                // simply destroy everything, because we are detached from DOM
                this.destroy();
                return;
            }
            // else check if something has changed
            else if (
                containerHeight !== this._container.clientHeight ||
                containerWidth !== this._container.clientWidth ||
                scrollHeight !== this._container.scrollHeight ||
                scrollWidth !== this._container.scrollWidth
            ) {
                // and if something has changed, refresh the cache
                containerHeight = this._container.clientHeight;
                containerWidth = this._container.clientWidth;
                scrollHeight = this._container.scrollHeight;
                scrollWidth = this._container.scrollWidth;

                // and tell the scrollView about the parent update
                this._scrollView.parentUpdated();
            }

            if (this._scrollTop !== this._container.scrollTop) {
                this.scrollTop(this._container.scrollTop);
            }
            else if (oldScrollTop < scrollHeight) {
                this._scrollView.scrollTopUpdated(oldScrollTop);
            }

            if (this._scrollLeft !== this._container.scrollLeft) {
                this.scrollLeft(this._container.scrollLeft);
            }
            else if (oldScrollLeft < scrollWidth) {
                this._scrollView.scrollLeftUpdated(oldScrollLeft);
            }
        };
    }

    /**
     * This function serves as getter and setter for the scrollTop value
     *
     * @param {number} [aScrollTop] The new scrollTop value
     * @return {number} The new scrollTop value
     */
    scrollTop(aScrollTop) {
        // If this method was called with something else than a number, or scrolling is
        // completly disabled, just return the scroll top and do nothing else
        if (typeof aScrollTop !== 'number' || this._options.disableYScrolling) {
            return this._container.scrollTop;
        }

        let newScrollTop = aScrollTop;
        // then validate the newScrollTop value
        if (newScrollTop < 0) {
            newScrollTop = 0;
        }
        else if (newScrollTop > this._container.scrollHeight - this._container.clientHeight) {
            newScrollTop = this._container.scrollHeight - this._container.clientHeight;
        }

        // if the scroll top has changed
        if (this._scrollTop !== newScrollTop) {
            // call the update trigger and save the scroll top value
            this._scrollView.scrollTopUpdated(newScrollTop);
            this._container.scrollTop = newScrollTop;
            this._scrollTop = newScrollTop;
        }

        // finally simply return the scrollTop value
        return newScrollTop;
    }

    /**
     * This function serves as getter and setter for the scrollLeft value
     *
     * @param {number} [aScrollLeft] The new scrollLeft value
     * @return {number} The new scrollLeft value
     */
    scrollLeft(aScrollLeft) {
        // If this method was called with something else than a number, or scrolling is
        // completly disabled, just return the scroll top and do nothing else
        if (arguments.length === 0 || this._options.disableXScrolling) {
            return this._container.scrollLeft;
        }

        let newScrollLeft = aScrollLeft;
        // now validate the scrollLeft value
        if (newScrollLeft < 0) {
            newScrollLeft = 0;
        }
        else if (newScrollLeft > this._container.scrollWidth - this._container.clientWidth) {
            newScrollLeft = this._container.scrollWidth - this._container.clientWidth;
        }

        // if scrollLeft has changed
        if (this._scrollLeft !== newScrollLeft) {
            // call the update trigger and save set the scrollLeft value
            this._scrollView.scrollLeftUpdated(newScrollLeft);
            this._container.scrollLeft = newScrollLeft;
            this._scrollLeft = newScrollLeft;
        }

        // finally return the scrollLeft value
        return newScrollLeft;
    }

    /**
     * This method is like the destructor. If you destroy this object, all footprints like
     * event listeners and so on get removed and destroyed.
     */
    destroy() {
        // first clear the interval
        window.clearInterval(this._intervalPointer);

        // then clean up the event listeners
        Object.keys(this._eventListener).forEach((aKey) => {
            this._container.removeEventListener(aKey, this._eventListener[aKey]);
        });

        // destroy the scrollView
        this._scrollView.destroy();

        // and null the pointers to the GC can clean up, even if this object isn't cleaned up
        this._scrollView = null;
        this._container = null;
    }
}
