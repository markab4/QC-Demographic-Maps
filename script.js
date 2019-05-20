let config = {
        percent: 0,
        lat: 0,
        lng: 0,
        segX: 14,
        segY: 12,
        isHaloVisible: true,
        isPoleVisible: true,
        autoSpin: true,
        zoom: 0,
        skipPreloaderAnimation: false,
    },
    globeDoms, vertices, world, worldBg, globe, globeContainer, globePole, globeHalo,
    pixelExpandOffset = 1.5,
    rX = 0, rY = 0, rZ = 0,
    sinRX, sinRY, sinRZ,
    cosRX, cosRY, cosRZ,
    dragX, dragY, dragLat, dragLng,
    isMouseDown = false, isTweening = false,
    tick = 1,
    URLS = {
        bg: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/6043/css_globe_bg.jpg',
        diffuse: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/6043/css_globe_diffuse.jpg',
        halo: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/6043/css_globe_halo.png',
    },
    transformStyleName = PerspectiveTransform.transformStyleName;

function init(ref) {

    // world = document.querySelector('.world');
    world = document.querySelector('.world-globe');
    worldBg = document.querySelector('.world-bg');
    worldBg.style.backgroundImage = 'url(' + URLS.bg + ')';
    globe = document.querySelector('.world-globe');
    globeContainer = document.querySelector('.world-globe-doms-container');
    globePole = document.querySelector('.world-globe-pole');
    globeHalo = document.querySelector('.world-globe-halo');
    globeHalo.style.backgroundImage = 'url(' + URLS.halo + ')';


    regenerateGlobe();

    // events
    world.ondragstart = function () {
        return false;
    };
    world.addEventListener('mousedown', onMouseDown);
    world.addEventListener('mousemove', onMouseMove);
    world.addEventListener('mouseup', onMouseUp);
    world.addEventListener('touchstart', touchPass(onMouseDown));
    world.addEventListener('touchmove', touchPass(onMouseMove));
    world.addEventListener('touchend', touchPass(onMouseUp));

    loop();
}

function touchPass(func) {
    return function (evt) {
        evt.preventDefault();
        func.call(this, {pageX: evt.changedTouches[0].pageX, pageY: evt.changedTouches[0].pageY});
    };
}

function onMouseDown(evt) {
    isMouseDown = true;
    dragX = evt.pageX;
    dragY = evt.pageY;
    dragLat = config.lat;
    dragLng = config.lng;
}

function onMouseMove(evt) {
    if (isMouseDown) {
        let dX = evt.pageX - dragX;
        let dY = evt.pageY - dragY;
        config.lat = clamp(dragLat + dY * 0.5, -90, 90);
        config.lng = clampLng(dragLng - dX * 0.5, -180, 180);
    }
}

function onMouseUp(evt) {
    if (isMouseDown) {
        isMouseDown = false;
    }
}

function regenerateGlobe() {
    let dom, domStyle;
    let x, y;
    globeDoms = [];
    while (dom = globeContainer.firstChild) {
        globeContainer.removeChild(dom);
    }

    let segX = config.segX;
    let segY = config.segY;
    let diffuseImgBackgroundStyle = 'url(' + URLS.diffuse + ')';
    let segWidth = 1600 / segX | 0;
    let segHeight = 800 / segY | 0;

    vertices = [];

    let verticesRow;
    let radius = (536) / 2;

    let phiStart = 0;
    let phiLength = Math.PI * 2;

    let thetaStart = 0;
    let thetaLength = Math.PI;

    for (y = 0; y <= segY; y++) {

        verticesRow = [];

        for (x = 0; x <= segX; x++) {

            let u = x / segX;
            let v = 0.05 + y / segY * (1 - 0.1);

            let vertex = {
                x: -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
                y: -radius * Math.cos(thetaStart + v * thetaLength),
                z: radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
                phi: phiStart + u * phiLength,
                theta: thetaStart + v * thetaLength
            };
            verticesRow.push(vertex);
        }
        vertices.push(verticesRow);
    }
    $("section").css("margin-left", segWidth + 'px');
    for (y = 0; y < segY; ++y) {
        for (x = 0; x < segX; ++x) {
            dom = document.createElement('div');
            domStyle = dom.style;
            domStyle.position = 'absolute';
            domStyle.width = segWidth + 'px';
            domStyle.height = segHeight + 'px';
            domStyle.overflow = 'hidden';
            domStyle[PerspectiveTransform.transformOriginStyleName] = '0 0';
            domStyle.backgroundImage = diffuseImgBackgroundStyle;
            dom.perspectiveTransform = new PerspectiveTransform(dom, segWidth, segHeight);
            dom.topLeft = vertices[y][x];
            dom.topRight = vertices[y][x + 1];
            dom.bottomLeft = vertices[y + 1][x];
            dom.bottomRight = vertices[y + 1][x + 1];
            domStyle.backgroundPosition = (-segWidth * x) + 'px ' + (-segHeight * y) + 'px';
            globeContainer.appendChild(dom);
            globeDoms.push(dom);
        }
    }

}

function loop() {
    requestAnimationFrame(loop);
    render();
}

function render() {

    if (config.autoSpin && !isMouseDown && !isTweening) {
        config.lng = clampLng(config.lng - 0.2);
    }

    rX = config.lat / 180 * Math.PI;
    rY = (clampLng(config.lng) - 270) / 180 * Math.PI;

    globePole.style.display = config.isPoleVisible ? 'block' : 'none';
    globeHalo.style.display = config.isHaloVisible ? 'block' : 'none';

    let ratio = Math.pow(config.zoom, 1.5);
    pixelExpandOffset = 1.5 + (ratio) * -1.25;
    ratio = 1 + ratio * 3;
    globe.style[transformStyleName] = 'scale3d(' + ratio + ',' + ratio + ',1)';
    ratio = 1 + Math.pow(config.zoom, 3) * 0.3;
    worldBg.style[transformStyleName] = 'scale3d(' + ratio + ',' + ratio + ',1)';

    transformGlobe();
}

function clamp(x, min, max) {
    return x < min ? min : x > max ? max : x;
}

function clampLng(lng) {
    return ((lng + 180) % 360) - 180;
}

function transformGlobe() {

    let dom, perspectiveTransform;
    let x, y, v1, v2, v3, v4, vertex, verticesRow, i, len;
    if (tick ^= 1) {
        sinRY = Math.sin(rY);
        sinRX = Math.sin(-rX);
        sinRZ = Math.sin(rZ);
        cosRY = Math.cos(rY);
        cosRX = Math.cos(-rX);
        cosRZ = Math.cos(rZ);

        let segX = config.segX;
        let segY = config.segY;

        for (y = 0; y <= segY; y++) {
            verticesRow = vertices[y];
            for (x = 0; x <= segX; x++) {
                rotate(vertex = verticesRow[x], vertex.x, vertex.y, vertex.z);
            }
        }

        for (y = 0; y < segY; y++) {
            for (x = 0; x < segX; x++) {
                dom = globeDoms[x + segX * y];

                v1 = dom.topLeft;
                v2 = dom.topRight;
                v3 = dom.bottomLeft;
                v4 = dom.bottomRight;

                expand(v1, v2);
                expand(v2, v3);
                expand(v3, v4);
                expand(v4, v1);

                perspectiveTransform = dom.perspectiveTransform;
                perspectiveTransform.topLeft.x = v1.tx;
                perspectiveTransform.topLeft.y = v1.ty;
                perspectiveTransform.topRight.x = v2.tx;
                perspectiveTransform.topRight.y = v2.ty;
                perspectiveTransform.bottomLeft.x = v3.tx;
                perspectiveTransform.bottomLeft.y = v3.ty;
                perspectiveTransform.bottomRight.x = v4.tx;
                perspectiveTransform.bottomRight.y = v4.ty;
                perspectiveTransform.hasError = perspectiveTransform.checkError();

                if (!(perspectiveTransform.hasError = perspectiveTransform.checkError())) {
                    perspectiveTransform.calc();
                }
            }
        }
    } else {
        for (i = 0, len = globeDoms.length; i < len; i++) {
            perspectiveTransform = globeDoms[i].perspectiveTransform;
            if (!perspectiveTransform.hasError) {
                perspectiveTransform.update();
            } else {
                perspectiveTransform.style[transformStyleName] = 'translate3d(-8192px, 0, 0)';
            }
        }
    }
}

function goTo(lat, lng) {
    let dX = lat - config.lat;
    let dY = lng - config.lng;
    let roughDistance = Math.sqrt(dX * dX + dY * dY);
    isTweening = true;
    TweenMax.to(config, roughDistance * 0.01, {lat: lat, lng: lng, ease: 'easeInOutSine'});
    TweenMax.to(config, 1, {
        delay: roughDistance * 0.01, zoom: 1, ease: 'easeInOutSine', onComplete: function () {
            isTweening = false;
        }
    });
}

function rotate(vertex, x, y, z) {
    x0 = x * cosRY - z * sinRY;
    z0 = z * cosRY + x * sinRY;
    y0 = y * cosRX - z0 * sinRX;
    z0 = z0 * cosRX + y * sinRX;

    let offset = 1 + (z0 / 4000);
    x1 = x0 * cosRZ - y0 * sinRZ;
    y0 = y0 * cosRZ + x0 * sinRZ;

    vertex.px = x1 * offset;
    vertex.py = y0 * offset;
}

// shameless stole and edited from threejs CanvasRenderer
function expand(v1, v2) {

    let x = v2.px - v1.px, y = v2.py - v1.py,
        det = x * x + y * y, idet;

    if (det === 0) {
        v1.tx = v1.px;
        v1.ty = v1.py;
        v2.tx = v2.px;
        v2.ty = v2.py;
        return;
    }

    idet = pixelExpandOffset / Math.sqrt(det);

    x *= idet;
    y *= idet;

    v2.tx = v2.px + x;
    v2.ty = v2.py + y;
    v1.tx = v1.px - x;
    v1.ty = v1.py - y;

}

init();

$(function () {
    $slider = $("#slider");
    $slider.slider({
        value: 2007,
        min: 2007,
        max: 2018,
        step: .0001,
        animate: "slow",
        slide: function (event, ui) {
            let year = Math.round(ui.value);
            $("#amount").val(year);
        },
        stop: function (event, ui) {
            let year = Math.round(ui.value);
            $slider.slider("value", year);
            makeMap(year);
            let maps = document.getElementsByClassName("map-container");
            for (let i = 0; i < maps.length - 1; i++) {
                maps[i].classList.add("remove");
            }
            $(".remove").fadeOut(5000);
            setTimeout(function () {
                let remove = document.getElementsByClassName("remove");
                for (let i = 0; i < remove.length; i++) {
                    remove[i].parentNode.removeChild(remove[i]);
                }
                // map.parentNode.removeChild(map);
                // map.style = "visibility: none";
            }, 10000);
        }
    });
    let year = $slider.slider("value");
    $("#amount").val(year);
    makeMap(year);
});

function makeMap(year) {
    let format = d3.format(",");

// Set tooltips
    let tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
            return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Students: </strong><span class='details'>" + format(isNaN(d["students" + year]) ? 0 : d["students" + year]) + "</span>";
        });

    let margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    let color = d3.scaleThreshold()
        .domain([0, 1, 5, 10, 25, 50, 100, 250, 500, 1000])
        .range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,81,156)", "rgb(8,48,107)", "rgb(3,19,43)"]);

    let svg = d3.select("#map-body")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append('g')
        .attr('class', 'map')
    ;

    let maps = document.getElementsByTagName("svg");
    for (let i = 0; i < maps.length; i++)
        maps[i].classList.add("map-container");
    let projection = d3.geoMercator()
        .scale(130)
        .translate([width / 2, height / 1.5]);

    let path = d3.geoPath().projection(projection);

    svg.call(tip);

    queue()
        .defer(d3.json, "world_countries.json")
        // .defer(d3.tsv, "world_enrollmentYear.tsv")
        .defer(d3.tsv, "ancestry_by_year.tsv")
        .await(ready);

    function ready(error, data, enrollmentYear) {
        let studentsByCountryId = {},
            studentsByCountryName = {};
        enrollmentYear.forEach(function (d) {
            studentsByCountryId[d.id] = +d["students" + year];
            studentsByCountryName[d.name] = +d["students" + year];
        });
        let props = Object.keys(studentsByCountryName).map(function (key) {
            return {key: key, value: this[key]};
        }, studentsByCountryName);
        props.sort(function (p1, p2) {
            return p2.value - p1.value;
        });
        let topFive = props.slice(0, 5);
        data.features.forEach(function (d) {
            d["students" + year] = studentsByCountryId[d.id];
        });

        topFive.forEach(function (element, index) {
            $("#country" + index).html(element.key);
            $("#students" + index).html(element.value);
        });
        // $(".table").css("width", $( window ).width() - 100);

        svg.append("g")
            .attr("class", "countries")
            .selectAll("path")
            .data(data.features)
            .enter().append("path")
            .attr("d", path)
            .style("fill", function (d) {
                return studentsByCountryId[d.id] ? color(studentsByCountryId[d.id]) : "rgb(247,251,255)";
            })
            .style('stroke', 'white')
            .style('stroke-width', 1.5)
            // .style("opacity", 1)
            // tooltips
            .style("stroke", "white")
            .style('stroke-width', 0.3)
            .on('mouseover', function (d) {
                tip.show(d);

                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "white")
                    .style("stroke-width", 3);
            })
            .on('mouseout', function (d) {
                tip.hide(d);

                d3.select(this)
                // .style("opacity", 0.8)
                    .style("stroke", "white")
                    .style("stroke-width", 0.3);
            });

        svg.append("path")
            .datum(topojson.mesh(data.features, function (a, b) {
                return a.id !== b.id;
            }))
            // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
            .attr("class", "names")
            .attr("d", path);
    }
}
