import todoWidget from "./todoWidget.js";
import boldWidget from "./boldWidget.js";
import redWidget from "./redWidget.js";
import pbarWidget from "./pbarWidget.js";

const widgetsArr = [todoWidget, boldWidget, redWidget, pbarWidget]

function addWidget(widget) {
    widgetsArr.push(widget)
}

function getWidgets() {
    return widgetsArr.reduce((acc, { tag, render }) => ({ ...acc, [tag]: render }), {});
}

function getWidgetsArr() {
    return widgetsArr;
}

export { getWidgets, getWidgetsArr };