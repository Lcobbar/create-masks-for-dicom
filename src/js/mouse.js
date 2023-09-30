class MouseSelection {

    constructor(parent,  options) {
        this.parent = parent;
        this.options = options;
        this.pathsHistory = []; //we need this for undoing changes
    }

    init(option) {
        let path = new paper.Path();
        path.option = option;
        path.fillColor = option.fillColor;
        path.strokeColor = option.strokeColor;
        path.closed = false;
        return path;
    }

    drawPath(option) {
        let lastAddedPoint = null;
        let path = this.init(option)
        this.parent.onMouseDown = (event) => {
            if (path.curves.length > 0) {
                let firstPoint = path.curves[0].points[0];
                if (Math.abs(event.point.x - firstPoint.x) < 3 && Math.abs(event.point.y - firstPoint.y) < 3) {
                    path.closed = true;
                    this.parent.onMouseMove();
                    this.parent.onMouseMove = null;
                    this.parent.onMouseDown = null;
                    path.selected = false;
                    this.drawPath(option);
                    this.pathsHistory.push(path.clone()); 
                    return;
                }
            }
            if (!path.closed) {
                path.lineTo(event.point);
            } 
        }

        this.parent.onMouseMove = (event)=> {
            if (lastAddedPoint) {
                path.removeSegment(path.segments.length - 1);
                lastAddedPoint = null;
            }
            if (!path.closed) {
                let newPoint = event.point.clone();
                path.lineTo(newPoint);
                lastAddedPoint = newPoint;
            }
        }
        return path;
    }
    
    clear() {
        this.pathsHistory = [];
        this.parent.onMouseDown = null;
        this.parent.onMouseMove = null;
        for (let j = 0; j < paper.project.layers.length; j++) {
            let layer = paper.project.layers[j];
            for (let i = layer.children.length - 1; i >= 0; i--) {
                let item = layer.children[i];
                if (item instanceof paper.Path) {
                    item.remove();
                }
            }
        }
    }
    
    undo() {
        if (this.pathsHistory.length) {
            this.pathsHistory.pop(); 
            paper.project.activeLayer.removeChildren();
            this.pathsHistory.forEach(savedPath => {
                paper.project.activeLayer.addChild(savedPath.clone());
            });
            
            paper.view.draw();
        }
    }
}