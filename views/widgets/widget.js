import todoWidget from "./todoWidget.js";
import boldWidget from "./boldWidget.js";
import redWidget from "./redWidget.js";

const widgetsArr = [todoWidget, boldWidget, redWidget]

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