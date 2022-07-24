export default class PatternCell {
    constructor(p5, x, y, width, height, palette, pattern, canExpand) {
        this.p = p5;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.palette = palette;
        this.pattern = pattern;
        this.canExpand = canExpand;
        this.patternColours = this.p.shuffle(this.palette);
        this.patternActive = false;
        this.p.patternColors();
        this.patternAngle = this.p.int(this.p.random(4)) * this.p.PI / 4;
    }

    update() {
        if(this.canExpand) {
            this.width++;
            this.height++;
        }
    }

    draw() {
        this.p.fill(this.palette[0]);
        this.p.rect(this.x, this.y, this.width, this.height);
        if(this.patternActive) {
            this.p.patternColors(this.patternColours);
            this.p.pattern(this.pattern);
            this.p.patternAngle(this.patternAngle);
            this.p.rectPattern(this.x, this.y, this.width, this.height);
        }
    }
}