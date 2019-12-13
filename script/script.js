const VTANKE = new function () {
    let start, load;
    let enemyX = 0, enemyY = 0;
    let cnv, ctx, width, height, cx, cy;
    let person, mapGenerateEnemy, score = 0, bonusTime = 4;
    let enemy = [], bull = [], bullEnemy = [], bonus = [];

    let cnvCoords = {
        x : 0,
        y : 0
    };
    let mouse = {
        x : cx,
        y : 20
    };
    let key = {
        w  : 0, s  : 0,
        d  : 0, a  : 0,
        wTrue : 0, sTrue : 0,
        dTrue : 0, aTrue : 0
    };
    let keyCode = {
        w: 87, s: 83,
        d: 68, a: 65
    };
    let getEnemy = {
        id : 0, time : 0
    };
    let images = [
        ['arena',          'style/img/arena16.jpg'],
        ['tank',           'style/img/auto.png'],
        ['dulo',           'style/img/smogun.png'],
        ['enemy',          'style/img/sold.png'],
        ['sight',          'style/img/sight.png'],
        ['bull_tank',      'style/img/bull_tank.png'],
        ['bull_enemy',     'style/img/bull_enemy.png'],
        ['bonus_life',     'style/img/bonus_life.png'],
        ['bonus_magazine', 'style/img/bonus_magazine.png'],
        ['info_bull',      'style/img/info_bull.png'],
        ['info_magazine',  'style/img/info_magazine.png'],
        ['logo_small',     'style/img/logo_small.png'],
        ['score',          'style/img/score.png'],
    ];
    let sounds = [
        ['fon',       'audio/fon.mp3',            0.2  ],
        ['life',      'audio/bonus_life.mp3',     0.3  ],
        ['magazine',  'audio/bonus_magazine.mp3', 0.2  ],
        ['fire',      'audio/fire.mp3',           0.1  ],
        ['enemyFire', 'audio/enemy_fire.mp3',     0.05 ],
        ['explode',   'audio/explode.mp3',        0.5  ]
    ];

    let image = function() {
        let obj = {};
        for (let i = 0; i < images.length; i++) {
            obj[images[i][0]] = new Image();
            obj[images[i][0]].src = images[i][1];
        }
        return obj;
    }();
    let sound = function() {
        let obj = {};

        for(let i=0; i<sounds.length; i++) {
            let audio    = new Audio();
            audio.src    = sounds[i][1];
            audio.volume = sounds[i][2] || 1;
            obj[sounds[i][0]] = {
                elem  : audio,
                state : 'stop',

                play : function() {
                    this.elem.currentTime = 0;
                    this.elem.play();
                    this.state = 'play';
                },
                stop : function() {
                    this.elem.pause();
                    this.elem.currentTime = 0;
                    this.state = 'stop';
                },
                repeat : function () {
                    this.elem.loop = true;
                }
            };
        }
        return obj;
    }();

    class Person {
        constructor() {
            this.hp       = 100;
            this.hpStep   = 0.1;
            this.speed    = 0.2;
            this.deg      = 0;
            this.step_deg = 0;
            this.step_x   = 0;
            this.step_y   = 0;
            this.go_x     = 0;
            this.go_y     = 0;
            this.bullets  = 100;
            this.magazine = 10;
            this.flagFire = false;
            this.bullTime = 5;
        }
        coor(d) {
            this.deg = d;
            if (this.deg > 180)    this.deg = 181 - 360;
            if (this.deg < (-180)) this.deg = 360 - 181;

            let step_speed = this.speed / (90 / this.speed);
            let steps = this.deg / this.speed;
            let coor_step = step_speed * steps;

            if (this.deg >= 0 && this.deg <= 90) {
                this.step_x = coor_step;
                this.step_y = this.speed - coor_step;
            }
            if (this.deg > 90 && this.deg <= 180) {
                steps  = (this.deg - 90) / this.speed;
                this.step_x = this.speed - (step_speed * steps);
                this.step_y = -(step_speed * steps);
            }
            if (this.deg < (-90) && this.deg >= (-180)) {
                steps  = (this.deg + 90) / this.speed;
                this.step_x = -(this.speed + (step_speed * steps));
                this.step_y = (step_speed * steps);
            }
            if (this.deg < 0 && this.deg >= (-90)) {
                this.step_x = coor_step;
                this.step_y = this.speed + coor_step;
            }
        }
        autoControl() {
            if ((key.w || key.wTrue) && !key.sTrue)      this.go("w", 1);
            if ((key.s || key.sTrue) && !key.wTrue)      this.go("s", 0);
            if (key.d && (key.w || key.s) && !key.aTrue) this.turn('d', 'w', 's');
            if (key.a && (key.w || key.s) && !key.dTrue) this.turn('a', 's', 'w');
        }
        go(k, route) {
            key[k+"True"]= 1;
            if (key[k]) {
                if (this.speed < 8) {
                    this.speed = numb(this.speed, 0.2, 1);
                }
                this.condAuto(route);
            } else if(key[k+"True"]) {
                this.step_deg = 0;
                if (this.speed > 0.2) {
                    this.speed = numb(this.speed, 0.2, 0);
                    this.condAuto(route);
                } else {
                    key[k+"True"] = 0;
                }
            }
        }
        turn(k, k1, k2) {
            key[k+"True"]= 1;
            if (this.step_deg < 2)
                this.step_deg = numb(this.step_deg, 0.1, 1);
            if (key[k1]) this.coor(this.deg + this.step_deg);
            if (key[k2]) this.coor(this.deg - this.step_deg);
        }
        condAuto(up) {
            let res = false;
            let x, y, coundUpY, coundUpX, ex, ey;
            person.coor(this.deg);
            if (up) {
                x = this.go_x + this.step_x;
                y = this.go_y + this.step_y;
                ex = -this.step_x;
                ey = this.step_y;
                coundUpY = this.step_y < 0;
                coundUpX = this.step_x < 0;
            } else {
                x = this.go_x - this.step_x;
                y = this.go_y - this.step_y;
                ex = this.step_x;
                ey = -this.step_y;
                coundUpY = this.step_y > 0;
                coundUpX = this.step_x > 0;
            }

            let coundX = this.go_x <= 940 && this.go_x >= (-940);
            let coundY = this.go_y <= 940 && this.go_y >= (-940);

            if (this.go_y < 940 && this.go_y > (-940) && this.go_x < 940 && this.go_x > (-940)) {
                this.go_x = x;
                this.go_y = y;
                enemyX = ex;
                enemyY = ey;
                res = true;
            }
            if (this.go_y >= 940) {
                if (coundX)    { this.go_x = x; enemyX = ex; }
                if (coundUpY)  { this.go_y = y; enemyY = ey; }
                res = true;
            }
            if (this.go_y <= (-940)) {
                if (coundX)    { this.go_x = x; enemyX = ex; }
                if (!coundUpY) { this.go_y = y; enemyY = ey; }
                res = true;
            }
            if (this.go_x >= 940) {
                if (coundY)    { this.go_y = y; enemyY = ey; }
                if (coundUpX)  { this.go_x = x; enemyX = ex; }
                res = true;
            }
            if (this.go_x <= (-940)) {
                if (coundY)    { this.go_y = y; enemyY = ey; }
                if (!coundUpX) { this.go_x = x; enemyX = ex; }
                res = true;
            }
            return res;
        }
        fire() {
            let push;
            if (this.flagFire) {
                if (this.bullTime === 5) {
                    this.bullTime = 0;

                    if (this.bullets <= 1) {
                        if (this.magazine > 0) {
                            this.bullets = 100;
                            this.magazine--;
                            push = true;
                        } else {
                            if (this.bullets===1)
                                push = true;
                            this.bullets = 0;
                        }
                    } else {
                        this.bullets--;
                        push = true;
                    }
                } else {
                    this.bullTime++;
                }
            } else {
                this.bullTime = 5;
            }
            if (push) {
                bull.push(
                    new Bull({
                        img    : image.bull_tank,
                        x      : cx - image.bull_tank.width / 4,
                        y      : cy - image.bull_tank.height / 2,
                        frames : 2,
                        spd    : 8
                    })
                );
                sound.fire.play();
            }
        }
        life() {
            if(this.lifeLineWidth() > 4) {
                ctx.strokeStyle = 'rgba(0,0,0,0.99)';
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                roundRect(ctx, cx - 100, 17, 200, 5, 3, true);
                ctx.fillStyle = this.lifeLineColor();
                roundRect(ctx, cx - 100, 17, this.lifeLineWidth(), 5, 3, true, true);
            } else {
                VTANKE.stop();
            }
        }
        lifeLineWidth() {
            return (200 / 100) * this.hp
        }
        lifeLineColor() {
            const hp = this.hp;
            if (hp >= 50)                return '#00cc48';
            else if (hp < 50 && hp > 20) return '#e1a145';
            else                         return '#ef1100';
        }
        lifeMinus(num = 1) {
            this.hp = numb(this.hp, this.hpStep*num);
        }
        lifePlus(num = 1) {
            if(numb(this.hp, this.hpStep*num,1)>100) {
                this.hp = 100;
            } else {
                this.hp = numb(this.hp, this.hpStep*num,1);
            }
        }
        bullPlus() {
            if(this.magazine === 0 && this.bullets === 0) {
                this.bullets+=100;
            } else {
                this.magazine++;
            }
        }
    }
    class Node {
        constructor(opt) {
            this.img    = opt.img;
            this.w      = opt.img.width;
            this.h      = opt.img.height;
            this.x      = opt.x;
            this.y      = opt.y;
            this.cx     = this.w / 2 / opt.frames;
            this.cy     = this.h / 2;
            this.spd    = opt.spd;
            this.frm    = 0;
            this.flag   = true;
            this.delete = false;
        }
        dist(x, y) {
            return Math.sqrt(Math.pow(this.x + this.cx - x, 2) + Math.pow(this.y + this.cy - y, 2));
        }
        step(pointX, pointY) {
            const { x, y, cx, cy, spd } = this;

            let stepX = (x > pointX - cx) ? (x - pointX + cx) : (pointX - x - cx);
            let stepY = (y > pointY - cy) ? (y - pointY + cy) : (pointY - y - cy);
            let dist  = this.dist(pointX, pointY);

            return (dist === 0) ? {
                x : 0,
                y : 0
            } : {
                x : stepX / dist * spd,
                y : stepY / dist * spd
            };
        }
        point(x = this.x, y = this.y) {
            const { cx:cx, cy:cy } = this;
            return {
                x  : x + cx - cy,
                y  : y + cy - cy,
                dx : x + cx + cy,
                dy : y + cy + cy
            };
        }
    }
    class Enemy extends Node {
        constructor(opt) {
            super(opt);
            this.id       = opt.id;
            this.x        = opt.x + this.w / 7 / 2;
            this.y        = opt.y + this.h / 2;
            this.upTime   = Date.now();
            this.upFreq   = 45;
            this.bullTime = 0;
        }
    }
    class Bull extends Node {
        constructor(opt) {
            super(opt);
            this.aimX = cx;
            this.aimY = cy;
        }
        step() {
            return super.step(this.aimX, this.aimY);
        }
    }

    let getMapEnemy = (w, h) => {
        return [
            [[-150, w+100], [-150, -50  ]], // top
            [[-150, w+100], [h,    h+100]], // bottom
            [[-150, -50  ], [-150, h+100]], // left
            [[w,    w+100], [-150, h+100]]  // right
        ];
    };
    let cnvGetCoords = () => {
        let box = cnv.getBoundingClientRect();
        cnvCoords.x = box.x + pageXOffset;
        cnvCoords.y = box.y + pageYOffset;
    };
    let keyDown = (e) => {
        let code = e.keyCode;
        if (code === keyCode.w) key.w = 1;
        if (code === keyCode.s) key.s = 1;
        if (code === keyCode.d) key.d = 1;
        if (code === keyCode.a) key.a = 1;
    };
    let keyUp = (e) => {
        let code = e.keyCode;
        if (code === keyCode.w) key.w = 0;
        if (code === keyCode.s) key.s = 0;
        if (code === keyCode.d) { key.d = 0; key.dTrue = 0; }
        if (code === keyCode.a) { key.a = 0; key.aTrue = 0; }

        if ((code === keyCode.d && !key.a)     ||
            (code === keyCode.a && !key.d)     ||
            (code === keyCode.d && !key.aTrue) ||
            (code === keyCode.a && !key.dTrue))
            person.step_deg = 0;
    };
    let getNumRandom = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };
    let createBonus = (name, x, y) => {
        if(bonusTime > 0) {
            bonusTime --;
        } else {
            bonus.push({
                name   : name,
                img    : image["bonus_"+name],
                x      : x,
                y      : y,
                delete : false
            });
            bonusTime = getNumRandom(5, 15);
        }
    };
    let numb = (a, b, plus) => {
        return (plus) ? (Math.round((a + b) * 1000) / 1000) : (Math.round((a - b) * 1000) / 1000);
    };
    let distance = (x, y, dx, dy) => {
        return Math.sqrt(Math.pow(x - dx, 2) + Math.pow(y - dy, 2));
    };
    let roundRect = (ctx, x, y, w, h, radius, fill, stroke) => {
        if (typeof stroke === 'undefined') stroke = true;
        if (typeof radius === 'undefined') radius = 5;
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            let defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (let side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + w - radius.tr, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
        ctx.lineTo(x + w, y + h - radius.br);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
        ctx.lineTo(x + radius.bl, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    };
    let loadImage = (img, w, h, x = 0, y = 0) => {
        w = w || img.width;
        h = h || img.height;
        ctx.drawImage(img, x, y, w, h);
    };
    let fireBull = (obj) => {
        let distAim    = distance(obj.x+obj.cx, obj.y+obj.cy, obj.aimX, obj.aimY);
        let distCenter = distance(obj.x+obj.cx, obj.y+obj.cy, cx, cy);
        let flag       = false;
        if(obj.flag) {
            flag = distAim > 15;
            obj.flag = distAim <= 15;
        } else {
            if(distAim<=5 && distAim>0) bull.shift();
            if(distCenter) flag = distAim > 15;
        }
        if(flag) {
            obj.spd   = (distCenter === 0) ? 48 : 20;
            obj.frm   = (distCenter === 0) ? 20 : 0;
            let pageX = (obj.aimX > obj.x+obj.cx) ? obj.x + obj.step().x : obj.x - obj.step().x;
            let pageY = (obj.aimY > obj.y+obj.cy) ? obj.y + obj.step().y : obj.y - obj.step().y;
            obj.x     = pageX;
            obj.y     = pageY;
            ctx.save();
            ctx.translate(obj.x+obj.cx, obj.y+obj.cy);
            ctx.rotate(Math.atan2(obj.aimY - cy, obj.aimX - cx) + 1.5708);
            ctx.translate(-obj.x-obj.cx, -obj.y-obj.cy);
            ctx.drawImage(obj.img, obj.frm, 0, obj.w/2,  obj.h, obj.x, obj.y, obj.w/2, obj.h);
            ctx.restore();

            for(let i=0; i<enemy.length; i++) {
                if(obj.aimX >= enemy[i].point().x &&
                    obj.aimY >= enemy[i].point().y &&
                    obj.aimX <= enemy[i].point().dx &&
                    obj.aimY <= enemy[i].point().dy) {

                    if (obj.point().dx >= enemy[i].point().x &&
                        obj.point().dy >= enemy[i].point().y &&
                        obj.point().x <= enemy[i].point().dx &&
                        obj.point().y <= enemy[i].point().dy) {

                        obj.delete = true;
                        enemy[i].delete = true;

                        for (let i = 0; i < bull.length; i++) {
                            if (bull[i].delete) {
                                bull.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            }
            obj.x += enemyX;
            obj.y += enemyY;
            obj.aimX += enemyX;
            obj.aimY += enemyY;
        } else {
            obj.aimX = mouse.x;
            obj.aimY = mouse.y;
            obj.x    = cx-obj.cx;
            obj.y    = cy-obj.cy;
        }
    };
    let enemyFire = (obj) => {
        let pageX = (obj.aimX > obj.x+obj.cx) ? obj.x + obj.step().x : obj.x - obj.step().x;
        let pageY = (obj.aimY > obj.y+obj.cy) ? obj.y + obj.step().y : obj.y - obj.step().y;

        let dist2 = distance(pageX+obj.cx, pageY+obj.cy, cx, cy);

        obj.x = pageX + enemyX;
        obj.y = pageY + enemyY;
        obj.aimX += enemyX;
        obj.aimY += enemyY;

        let dist = distance(obj.x + obj.cx, obj.y + obj.cy, obj.aimX, obj.aimY);

        ctx.save();
        ctx.translate(obj.x + obj.cx, obj.y + obj.cy);
        ctx.rotate(Math.atan2(obj.aimY - obj.y-obj.cy, obj.aimX - obj.x-obj.cx) - 1.5708);
        ctx.translate(-obj.x - obj.cx, -obj.y - obj.cy);
        ctx.drawImage(obj.img, 0, 0, obj.w, obj.h, obj.x, obj.y, obj.w, obj.h);
        ctx.restore();

        if(dist < 40 ) {
            obj.delete = true;
            if(dist2 < 40) {
                person.lifeMinus();
            }
            for (let i = 0; i < bullEnemy.length; i++) {
                if (bullEnemy[i].delete) {
                    bullEnemy.splice(i, 1);
                    break;
                }
            }
        }
    };
    let changeRouteEnemy = (obj, o) => {
        let min  = [obj.a[0], obj.b[0], obj.c[0], obj.d[0]].sort((a, b) => a - b)[0];
        let min1 = [obj.a[0], obj.b[0], obj.c[0], obj.d[0]].sort((a, b) => a - b)[1];
        let res, res1;

        if(obj.b[0] === min) res = {x: obj.b[1][0], y: obj.b[1][1]};
        if(obj.a[0] === min) res = {x: obj.a[1][0], y: obj.a[1][1]};
        if(obj.c[0] === min) res = {x: obj.c[1][0], y: obj.c[1][1]};
        if(obj.d[0] === min) res = {x: obj.d[1][0], y: obj.d[1][1]};

        if(obj.b[0] === min1) res1 = {x: obj.b[1][0], y: obj.b[1][1]};
        if(obj.a[0] === min1) res1 = {x: obj.a[1][0], y: obj.a[1][1]};
        if(obj.c[0] === min1) res1 = {x: obj.c[1][0], y: obj.c[1][1]};
        if(obj.d[0] === min1) res1 = {x: obj.d[1][0], y: obj.d[1][1]};

        let a1 = distance(o.x, o.y, res.x, res.y);
        let a2 = distance(o.x, o.y, res1.x, res1.y);

        let max = Math.min(a1, a2);

        if(a1 === max) return res;
        if(a2 === max) return res1;
    };
    let enemyShow = (obj) => {
        if (obj.dist(cx, cy) >= 120) {
            let objX         = obj.x + obj.cx;
            let objY         = obj.y + obj.cy;
            let pageX        = (objX > cx) ? obj.x - obj.step(cx,cy).x : obj.x + obj.step(cx,cy).x;
            let pageY        = (objY > cy) ? obj.y - obj.step(cx,cy).y : obj.y + obj.step(cx,cy).y;
            let objPoint     = obj.point();
            let objPointPage = obj.point(pageX, pageY);
            let enemyLength  = enemy.length;
            let route        = [];
            let enemyX, enemyY, enemyPoint, newCoor, minDistObj;

            for(let i=0; i<enemyLength; i++) {
                enemyX     = enemy[i].x + enemy[i].cx;
                enemyY     = enemy[i].y + enemy[i].cy;
                enemyPoint = enemy[i].point();

                if( obj.id           !== enemy[i].id           &&
                    obj.dist(cx, cy) >=  enemy[i].dist(cx, cy) &&
                    enemyPoint.dx    >=  objPointPage.x        &&
                    enemyPoint.dy    >=  objPointPage.y        &&
                    enemyPoint.x     <=  objPointPage.dx       &&
                    enemyPoint.y     <=  objPointPage.dy) {

                    newCoor = changeRouteEnemy({
                        a: [distance(cx, cy, enemyX+50, enemyY),    [enemyX+50, enemyY]],
                        b: [distance(cx, cy, enemyX,    enemyY+50), [enemyX,     enemyY+50]],
                        c: [distance(cx, cy, enemyX-50, enemyY),    [enemyX-50, enemyY]],
                        d: [distance(cx, cy, enemyX,    enemyY-50), [enemyX,     enemyY-50]]
                    }, {
                        x : objX,
                        y : objY
                    });

                    minDistObj = [
                        objPoint.x   - enemyPoint.dx,
                        objPoint.y   - enemyPoint.dy,
                        enemyPoint.x - objPoint.dx,
                        enemyPoint.y - objPoint.dy
                    ].sort((a, b) => a - b);

                    for (let i = 3; i >= 0; i--) {
                        if (minDistObj[i] < 0) {
                            minDistObj.splice(i, 1);
                        }
                    }
                    switch (minDistObj[0]) {
                        case objPoint.x   - enemyPoint.dx : route = [i, [objX-minDistObj[0], newCoor.y]          ]; break;
                        case objPoint.y   - enemyPoint.dy : route = [i, [newCoor.x,          objY-minDistObj[0]] ]; break;
                        case enemyPoint.x - objPoint.dx   : route = [i, [objX+minDistObj[0], newCoor.y]          ]; break;
                        case enemyPoint.y - objPoint.dy   : route = [i, [newCoor.x,          objY+minDistObj[0]] ]; break;
                        default                           : route = [i, [objX,               objY]               ];
                    }
                }
            }

            let move = true;

            if(route.length > 0) {
                let enemyPoint, flag, x, y, newPageX, newPageY, objPointPage;

                for (let i = 0; i < route.length; i++) {
                    flag         = [];
                    x            = route[i][0];
                    y            = route[i][1];
                    newPageX     = (obj.x + obj.cx > x) ? obj.x - obj.step(x, y).x : obj.x + obj.step(x, y).x;
                    newPageY     = (obj.y + obj.cy > y) ? obj.y - obj.step(x, y).y : obj.y + obj.step(x, y).y;
                    objPointPage = obj.point(newPageX, newPageY);
                    pageX        = newPageX;
                    pageY        = newPageY;
                    move         = true;

                    for (let i = 0; i < enemyLength; i++) {
                        if (obj.id !== enemy[i].id) {
                            enemyPoint = enemy[i].point();
                            if( enemyPoint.dx > objPointPage.x  &&
                                enemyPoint.dy > objPointPage.y  &&
                                enemyPoint.x  < objPointPage.dx &&
                                enemyPoint.y  < objPointPage.dy) {
                                flag[i] = false;
                                break;
                            } else {
                                flag[i] = true;
                            }
                        } else {
                            flag[i] = true;
                        }
                    }
                    for (let i=0; i<flag.length; i++) {
                        if (!flag[i]) {
                            pageX = obj.x;
                            pageY = obj.y;
                            move = false;
                            break;
                        }
                    }
                }
            }
            if (Date.now() - obj.upTime > obj.upFreq) {
                obj.upTime = Date.now();

                if (move) obj.frm = (obj.frm < obj.w - 35) ? obj.frm + 35 : 0;
                else obj.frm = 70;
            }

            obj.x = pageX;
            obj.y = pageY;
        } else if (obj.dist(cx, cy) <= 45) {
            obj.delete = true;
            person.lifeMinus(50);
            sound.explode.play();
        } else {
            obj.frm = 70;
        }

        obj.x += enemyX;
        obj.y += enemyY;

        if(obj.dist(cx, cy) < 200) {
            if(sound.enemyFire.elem.currentTime === 0 || sound.enemyFire.elem.currentTime > 0.025) sound.enemyFire.play();
            if (obj.bullTime<4) {
                obj.bullTime++;
            } else {
                createBullEnemy(obj.x, obj.y);
                obj.bullTime = 0;
            }
        }
        ctx.save();
        ctx.translate(obj.x + obj.cx, obj.y + obj.cy);
        ctx.rotate(Math.atan2(cy - obj.y - obj.cy, cx - obj.x - obj.cx) - 1.5708);
        ctx.translate(-obj.x - obj.cx, -obj.y - obj.cy);
        ctx.drawImage(obj.img, obj.frm, 0, 35, obj.h, obj.x, obj.y, 35, obj.h);
        ctx.restore();
    };
    let createBullEnemy = (x, y) => {
        bullEnemy.push(new Bull({
            img    : image.bull_enemy,
            x      : x,
            y      : y,
            spd    : 10,
            frames : 1
        }));
    };
    let enemyGenerate = (max, time) => {
        if(getEnemy.time < time) {
            getEnemy.time++;
        } else {
            getEnemy.time = 0;
            if(enemy.length < max) {
                let posMap = getNumRandom(0, 3);
                getEnemy.id++;

                enemy.push(new Enemy({
                    id     : getEnemy.id,
                    img    : image.enemy,
                    x      : getNumRandom(mapGenerateEnemy[posMap][0][0], mapGenerateEnemy[posMap][0][1]),
                    y      : getNumRandom(mapGenerateEnemy[posMap][1][0], mapGenerateEnemy[posMap][1][1]),
                    spd    : 1.2,
                    frames : 7
                }));
            }
        }
    };

    let showBonus = () => {
        for(let i = bonus.length-1; i >= 0; i--) {
            let obj = bonus[i];
            obj.x += enemyX;
            obj.y += enemyY;
            if(distance(obj.x, obj.y, cx, cy) < 45) {
                bonus.splice(i, 1);
                if (obj.name === "life") {
                    person.lifePlus(50);
                    sound.life.play();
                } else if (obj.name === "magazine") {
                    person.bullPlus();
                    sound.magazine.play();
                }
            } else {
                ctx.drawImage(obj.img, obj.x-(obj.img.width/2), obj.y-(obj.img.height/2));
            }
        }
    };
    let showTank = () => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(person.deg * (Math.PI / 180));
        ctx.translate(-cx, -cy);
        loadImage(image.tank, 60, 90, cx - 30, cy - 50);
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.atan2(mouse.y - cy, mouse.x - cx)+ 1.5708);
        ctx.translate(-cx, -cy);
        loadImage(image.dulo, 32, 57, cx - 16, cy - 42);
        ctx.restore();
    };
    let showInfoPerson = () => {
        person.life();
        loadImage(image.logo_small, image.logo_small.width, image.logo_small.height, 0, -5);
        loadImage(image.info_bull, image.info_bull.width, image.info_bull.height, 8, height-40);
        loadImage(image.info_magazine, image.info_magazine.width, image.info_magazine.height, 130, height-38);
        loadImage(image.score, image.score.width, image.score.height, width-ctx.measureText(`х ${score}`).width-55, 3);
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.font = "bold 24px Verdana";
        ctx.fillText(person.bullets, 52, height-12);
        ctx.fillText(person.magazine, 195, height-12);
        ctx.font = "bold 24px Verdana";
        ctx.fillText(`x ${score}`, width-ctx.measureText(`х ${score}`).width-15, 29);
    };
    let showFire = () => {
        person.fire();

        if (bull.length) {
            for (let i = 0; i < bull.length; i++) {
                fireBull(bull[i]);
            }
        }

        if (bullEnemy.length) {
            for (let i = 0; i < bullEnemy.length; i++) {
                enemyFire(bullEnemy[i]);
            }
        }
    };
    let showEnemy = () => {
        let nameBonus = ['life', 'magazine'][Math.floor(Math.random() * 2)];
        for(let i = enemy.length-1; i >= 0; i--) {
            if(enemy[i].delete) {
                createBonus(nameBonus, enemy[i].x+enemy[i].cx, enemy[i].y+enemy[i].cy);
                enemy.splice(i, 1);
                score++;
            } else {
                enemyShow(enemy[i]);
            }
        }
    };

    let update = () => {
        cnvGetCoords();
        ctx.clearRect(0, 0, width, height);
        person.autoControl();
        enemyGenerate(20, 100);
        loadImage(image.arena, '', '', (-(image.arena.width/2)+cx) - person.go_x, (-(image.arena.height/2)+cy) + person.go_y);
        if (bonus)
            showBonus();
        showEnemy();
        showTank();
        showInfoPerson();
        showFire();
        loadImage(image.sight, image.sight.width, image.sight.height, mouse.x - image.sight.width / 2, mouse.y - image.sight.height / 2);
        enemyX = 0;
        enemyY = 0;
        if(start)
            requestAnimationFrame(update);

    };

    this.game = (w, h, loading)  => {
        load = loading;
        width = w;
        height = h;
        cx = w / 2;
        cy = h / 2;

        mapGenerateEnemy = getMapEnemy(w, h);

        cnv = document.getElementById("cnv");
        ctx = cnv.getContext("2d");
        cnv.width = w;
        cnv.height = h;

        window.addEventListener("keydown", keyDown);
        window.addEventListener("keyup", keyUp);

        cnv.addEventListener('mousemove', function(e) {
            mouse.x = e.pageX-cnvCoords.x;
            mouse.y = e.pageY-cnvCoords.y;
        });
        cnv.addEventListener('mousedown', function() { // нажата
            person.flagFire = true;
            bull.aimX = mouse.x;
            bull.aimY = mouse.y;
        });
        cnv.addEventListener('mouseup', function() { // отпущена
            person.flagFire = false;
        });
    };
    this.start = () => {
        load();
        start = true;
        enemy.length = 0;
        bull.length = 0;
        bullEnemy.length = 0;
        bonus.length = 0;
        score = 0;
        person = new Person();
        sound.fon.play();
        sound.fon.repeat();
        update();
    };
    this.stop = () => {
        start = false;
        sound.fon.stop();
        load();
    }
};

window.addEventListener('load', () => {
    let $ = (id) => document.getElementById(id);

    let load              = $('load');
    let game              = $('game');
    let gameStart         = $('game__start');
    let gameStartBtn      = $('game__btn-start');
    let gameInfoBtn       = $('game__btn-info');
    let gameInfo          = $('game__info');
    let gameInfoLeft      = $('game__info-left');
    let gameInfoRight     = $('game__info-right');
    let gameInfoSeparator = $('game__info-separator');
    let gameLoad          = $('game__load');

    load.classList.add('unload');
    setTimeout(() => load.removeAttribute('class'), 1000);

    let loading = () => {
        let opacity = 0;
        let opacityStep = 0.025;

        let loadStart = () => {
            if(opacity < 1) {
                opacity = Math.round((opacity + opacityStep) * 1000) / 1000;
                gameLoad.style.opacity = opacity;
                requestAnimationFrame(loadStart);
            } else {
                gameStart.classList.toggle('game__start-none');
                loadStop();
            }
        };

        let loadStop = () => {
            if(opacity > 0) {
                opacity = Math.round((opacity - opacityStep) * 1000) / 1000;
                gameLoad.style.opacity = opacity;
                requestAnimationFrame(loadStop);
            } else {
                ['class', 'style'].forEach(attr => gameLoad.removeAttribute(attr));
            }
        };

        gameLoad.classList.add('game__load');
        loadStart();
    };

    VTANKE.game(game.clientWidth, game.clientHeight, loading);

    gameStartBtn.addEventListener('click', VTANKE.start);
    gameInfoBtn.addEventListener('click', function () {
        gameInfo.classList.toggle('game__info-active');
        gameInfoLeft.classList.toggle("game__info-show");
        gameInfoRight.classList.toggle("game__info-show");
        gameInfoSeparator.classList.toggle("game__info-show");
    });
});