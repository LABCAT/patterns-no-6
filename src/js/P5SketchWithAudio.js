import React, { useRef, useEffect } from "react";
import "./helpers/Globals";
import { PTN } from "./lib/p5.pattern";
import "p5/lib/addons/p5.sound";
import * as p5 from "p5";
import { Midi } from '@tonejs/midi'
import PlayIcon from './functions/PlayIcon.js';
import { TetradicColourCalculator } from "./functions/ColourCalculators";
import PatternCell from "./classes/PatternCell";

import audio from "../audio/patterns-no-6.ogg";
import midi from "../audio/patterns-no-6.mid";

const P5SketchWithAudio = () => {
    const sketchRef = useRef();

    const Sketch = p => {

        p.canvas = null;

        p.canvasWidth = window.innerWidth;

        p.canvasHeight = window.innerHeight;

        p.audioLoaded = false;

        p.player = null;

        p.PPQ = 3840 * 4;

        p.loadMidi = () => {
            Midi.fromUrl(midi).then(
                function(result) {
                    const noteSet1 = result.tracks[1].notes;
                    p.scheduleCueSet(noteSet1, 'executeCueSet1'); 
                    p.audioLoaded = true;
                    document.getElementById("loader").classList.add("loading--complete");
                    document.getElementById("play-icon").classList.remove("fade-out");
                }
            );
            
        }

        p.preload = () => {
            p.song = p.loadSound(audio, p.loadMidi);
            p.song.onended(p.logCredits);
        }

        p.scheduleCueSet = (noteSet, callbackName, poly = false)  => {
            let lastTicks = -1,
                currentCue = 1;
            for (let i = 0; i < noteSet.length; i++) {
                const note = noteSet[i],
                    { ticks, time } = note;
                if(ticks !== lastTicks || poly){
                    note.currentCue = currentCue;
                    p.song.addCue(time, p[callbackName], note);
                    lastTicks = ticks;
                    currentCue++;
                }
            }
        } 

        p.gridCoords = [];

        p.gridCells = [];

        p.expandingCellIndex = 0;

        p.expandingCell = null;

        p.setup = () => {
            p.canvas = p.createCanvas(p.canvasWidth, p.canvasHeight);
            p.colorMode(p.HSB);
            p.rectMode(p.CENTER);
            p.background(0, 0, 100);

            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    p.gridCoords.push(
                        {
                            x: i * p.width / 3 + p.width / 6,
                            y: j * p.height / 3 + p.height / 6,
                        }
                    )
                }
            }
        }

        

        p.draw = () => {
            // const d = p.width * 0.08;
            // p.pattern(p.randPattern(p.width / 3));
            // p.rectPattern(0, 0, p.width / 3, p.height / 3);

            // for (let i = 0; i < p.gridCoords.length; i++) {
            //     const cell = p.gridCoords[i],
            //         { x, y } = cell, 
            //         pallette = TetradicColourCalculator(
            //             p,
            //             p.random(0, 360),
            //             p.random(50, 100),
            //             p.random(50, 100),
            //         );
                
            //     p.patternColors(p.shuffle(pallette));
            //     p.pattern(p.randPattern(p.width / 3));
            //     p.patternAngle(p.int(p.random(4)) * p.PI / 4);
            //     p.rectPattern(x, y, p.width / 3, p.height / 3);
            // }
            if(p.audioLoaded && p.song.isPlaying()){
                p.background(0, 0, 100);

                for (let i = 0; i < p.gridCells.length; i++) {
                    const cell = p.gridCells[i];
                    cell.draw(); 
                    cell.update(); 
                }

                if(p.expandingCell) {
                    p.expandingCell.draw();
                    p.expandingCell.update();
                }
            }
        }

        p.executeCueSet1 = (note) => {
            const { currentCue, duration } = note,
                delayAmount = parseInt(duration * 1000) / p.gridCoords.length;
            
            if(currentCue % 4 === 1) {
                p.expandingCellIndex = Math.floor(p.random(0, 9));
                p.expandingCell = new PatternCell(
                    p,
                    p.gridCoords[p.expandingCellIndex].x,
                    p.gridCoords[p.expandingCellIndex].y,
                    p.width / 3,
                    p.height / 3,
                    TetradicColourCalculator(
                        p,
                        p.random(0, 360),
                        p.random(50, 100),
                        p.random(50, 100),
                    ),
                    p.randPattern(p.width / 3, 8)
                );
            } else if(currentCue % 2 === 0) {
                p.expandingCell.patternActive = true;
            } else if(currentCue % 4 === 3) {
                p.expandingCell.patternActive = false;
                p.expandingCell.canExpand = true;
            }

            const cells = p.shuffle([
                ...p.gridCoords.slice(0, p.expandingCellIndex), 
                ...p.gridCoords.slice(p.expandingCellIndex + 1)
            ]);

            for (let i = 0; i < cells.length; i++) {
                const { x, y } = cells[i];
                setTimeout(
                    function () {
                        if(currentCue % 2 === 0) {
                            p.gridCells[i].patternActive = true;
                        }
                        else {
                            p.gridCells[i] = new PatternCell(
                                p,
                                x,
                                y,
                                p.width / 3,
                                p.height / 3,
                                TetradicColourCalculator(
                                    p,
                                    p.random(0, 360),
                                    p.random(50, 100),
                                    p.random(50, 100),
                                ),
                                p.randPattern(p.width / 3)
                            );
                        }
                    },
                    (delayAmount * i)
                );
            }
        }

        p.randPattern = (t, excludeIndex = -1) => {
            const ptArr = [
                PTN.stripe(t / p.int(p.random(6, 12))),
                PTN.stripeCircle(t / p.int(p.random(6, 12))),
                PTN.stripePolygon(p.int(p.random(3, 7)),  p.int(p.random(6, 12))),
                PTN.stripeRadial(p.TAU /  p.int(p.random(6, 30))),
                PTN.wave(t / p.int(p.random(1, 3)), t / p.int(p.random(10, 20)), t / 5, t / 10),
                PTN.dot(t / 10, t / 10 * p.random(0.2, 1)),
                PTN.checked(t / p.int(p.random(5, 20)), t / p.int(p.random(5, 20))),
                PTN.cross(t / p.int(p.random(10, 20)), t / p.int(p.random(20, 40))),
                PTN.triangle(t / p.int(p.random(5, 20)), t / p.int(p.random(5, 20)))
            ]

            if(excludeIndex > 0) {
                return p.random(
                    [
                        ...ptArr.slice(0, excludeIndex), 
                        ...ptArr.slice(excludeIndex + 1)
                    ]
                );
            }
            return p.random(ptArr);
        }

        p.hasStarted = false;

        p.mousePressed = () => {
            if(p.audioLoaded){
                if (p.song.isPlaying()) {
                    p.song.pause();
                } else {
                    if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                        p.reset();
                        if (typeof window.dataLayer !== typeof undefined && !p.hasStarted){
                            window.dataLayer.push(
                                { 
                                    'event': 'play-animation',
                                    'animation': {
                                        'title': document.title,
                                        'location': window.location.href,
                                        'action': 'replaying'
                                    }
                                }
                            );
                            }
                    }
                    document.getElementById("play-icon").classList.add("fade-out");
                    p.canvas.addClass("fade-in");
                    p.song.play();
                    if (typeof window.dataLayer !== typeof undefined && !p.hasStarted){
                        window.dataLayer.push(
                            { 
                                'event': 'play-animation',
                                'animation': {
                                    'title': document.title,
                                    'location': window.location.href,
                                    'action': 'start playing'
                                }
                            }
                        );
                        p.hasStarted = false
                    }
                }
            }
        }

        p.creditsLogged = false;

        p.logCredits = () => {
            if (
                !p.creditsLogged &&
                parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)
            ) {
                p.creditsLogged = true;
                    console.log(
                    "Music By: http://labcat.nz/",
                    "\n",
                    "Animation By: https://github.com/LABCAT/"
                );
                p.song.stop();
            }
        };

        p.reset = () => {

        }

        p.updateCanvasDimensions = () => {
            p.canvasWidth = window.innerWidth;
            p.canvasHeight = window.innerHeight;
            p.canvas = p.resizeCanvas(p.canvasWidth, p.canvasHeight);
        }

        if (window.attachEvent) {
            window.attachEvent(
                'onresize',
                function () {
                    p.updateCanvasDimensions();
                }
            );
        }
        else if (window.addEventListener) {
            window.addEventListener(
                'resize',
                function () {
                    p.updateCanvasDimensions();
                },
                true
            );
        }
        else {
            //The browser does not support Javascript event binding
        }
    };

    useEffect(() => {
        new p5(Sketch, sketchRef.current);
    }, []);

    return (
        <div ref={sketchRef}>
            <PlayIcon />
        </div>
    );
};

export default P5SketchWithAudio;
