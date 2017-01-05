import {SVGTrack} from './SVGTrack.js';
import slugid from 'slugid';
import brush from './lite-d3-brush.js';
import {event} from 'd3-selection';

export class ViewportTracker2D extends SVGTrack {
    constructor(svgElement, registerViewportChanged, removeViewportChanged, setDomainsCallback) {
        super(svgElement);

        let uid = slugid.nice()
        this.uid = uid;

        this.removeViewportChanged = removeViewportChanged;
        this.setDomainsCallback = setDomainsCallback;

        this.viewportXDomain = null;
        this.viewportYDomain = null;

        this.brush = brush()
            .extent([[-Number.MAX_VALUE, -Number.MAX_VALUE],
                     [Number.MAX_VALUE, Number.MAX_VALUE]])
            .on('start brush', this.brushed.bind(this));

        this.gBrush = this.gMain
            .append('g')
            .attr('id', 'brush-' + this.uid)
            .call(this.brush);

        // turn off the ability to select new regions for this brush
        this.gBrush.selectAll('.overlay')
            .style('pointer-events', 'none');

        // turn off the ability to modify the aspect ratio of the brush
        this.gBrush.selectAll('.handle--n')
            .style('pointer-events', 'none')

        this.gBrush.selectAll('.handle--s')
            .style('pointer-events', 'none')

        this.gBrush.selectAll('.handle--w')
            .style('pointer-events', 'none')

        this.gBrush.selectAll('.handle--e')
            .style('pointer-events', 'none')

        registerViewportChanged(uid, this.viewportChanged.bind(this));

        // the viewport will call this.viewportChanged immediately upon
        // hearing registerViewportChanged
        console.log('constructor...', this.uid);
    }

    brushed() {
        let s = event.selection;

        if (!this._xScale || !this._yScale)
            return;

        let xDomain = [this._xScale.invert(s[0][0]), 
                       this._xScale.invert(s[1][0])];

        let yDomain = [this._yScale.invert(s[0][1]),
                       this._yScale.invert(s[1][1])];

        this.setDomainsCallback(xDomain, yDomain);
    }

    viewportChanged(viewportXScale, viewportYScale) {
        console.log('viewportChanged:');

        let viewportXDomain = viewportXScale.domain();
        let viewportYDomain = viewportYScale.domain();

        this.viewportXDomain = viewportXDomain;
        this.viewportYDomain = viewportYDomain;

        console.log('vpc:', this.uid);
        this.draw();
    }

    remove() {
        // remove the event handler that updates this viewport tracker
        this.removeViewportChanged(this.uid); 

        super.remove();
    }

    draw() {
        if (!this.viewportXDomain || !this.viewportYDomain)
            return;

        let x0 = this._xScale(this.viewportXDomain[0]);
        let y0 = this._yScale(this.viewportYDomain[0]);

        let x1 = this._xScale(this.viewportXDomain[1]);
        let y1 = this._yScale(this.viewportYDomain[1]);
         
        let dest = [[x0,y0],[x1,y1]];

        this.gBrush.call(this.brush.move, dest)
    }

    zoomed(newXScale, newYScale) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.draw();

    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        /*
        this.pMain.position.y = this.position[1];
        this.pMain.position.x = this.position[0];

        console.log('sp:', this.uid);
        */
        this.draw();
    }
}
