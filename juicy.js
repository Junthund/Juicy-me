/* REMEMBER:

* THE MAP EDITOR IS BASED ON A HTML CANVAS.
* THE OBJECTS PLACED IN THE MAP (BUILDING, ROADS, ETC.) WILL BE CALLED "COMPONENTS".

*/


// Component on the cursor (to be placed)
var actualComp;
// Placed components
var compList = [];
// Cell size: This can be modified for zoom
var cellSize = 15;
// Canvas size
var canvasWidth = cellSize * 50, 
    canvasHeight = cellSize * 30;

// Parent div to place the canvas
var fatherDiv = document.getElementById("input");

// Canvas object
var mapArea = {
    /* Properties:

    * canvas : HTML canvas object.
    * width, height, style : HTML canvas parameters.
    * context : Canvas 2D context.
    * x, y : coordinates of the cursor relative to the HTML canvas coordinates.
    
    Methods: 
    * Start : Initialize the canvas.
    * interval : Sets the time interval to update the canvas information.
    * clear : Clear the canvas information.
    */

    // The canvas object will be in this place
    canvas : document.createElement("canvas"),

    // Method to initiate the object
    start : function() {
        // Shortcut
        var canvas = this.canvas;

        // Set the parameters of the canvas
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style = "cursor:none;";

        // Get canvas context
        this.context = canvas.getContext("2d");

        // Place the canvas on the HTML
        fatherDiv.appendChild(canvas);

        // Refresh the canvas info (100 ms)
        this.interval = setInterval(updateGameArea, 100);

        // Get the coordinates of the canvas already placed on the HTML
        var canvasXY = canvas.getBoundingClientRect();

        /* This is to recalculate the canvas coords in case the windows
        is resized or scrolled */
        function reOffset(){ canvasXY = canvas.getBoundingClientRect(); }
        window.addEventListener('scroll', reOffset);
        window.addEventListener('resize', reOffset);

        // Updates the cursor coordinates when the mouse moves
        window.addEventListener('mousemove', function (e) {
            mouseXY = MouseCoords(e, canvasXY);

            /* Checks if the cursor coordinates are inside the canvas bounds.
            If so, update the cursor coordinates. */
            if (mouseXY.onScreenX && mouseXY.onScreenY) {
                mapArea.x = mouseXY.x;
                mapArea.y = mouseXY.y;
            }
        });

        // Place components on the map when the mouse clicks on them
        window.addEventListener('mousedown', function (e) {
            mouseXY = MouseCoords(e, canvasXY);

            /* Checks if the cursor coordinates are inside the canvas bounds.
            If so, add the component on the map. */
            if (mouseXY.onScreenX && mouseXY.onScreenY) {
                addComp(mouseXY.x, mouseXY.y);
            }
        });
    },

    // Clear the canvas content
    clear : function() {
        // Erase everything
        this.context.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw the grid
        for (var x = 0; x <= canvasWidth; x += cellSize) {
            this.context.moveTo(x, 0);
            this.context.lineTo(x, canvasHeight);
        }

        for (var y = 0; y <= canvasHeight; y += cellSize) {
            this.context.moveTo(0, y);
            this.context.lineTo(canvasWidth, y);
        }

        this.context.strokeStyle = "#000000";
        this.context.stroke();
    }
}

function component(x, y, width, height, color) {
    /* Component constructor.

    * x, y : coordinates to be placed.
    * width, height : number of cells wide and long.
    * color : hex color (accepts alpha; #RRGGBBAA)

    */

    // Set properties of the component
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;

    // Update the component position (useful for cursor component)
    this.update = function(){
        ctx = mapArea.context;
        ctx.fillStyle = this.color;
        var x2 = cellSize * this.width;
        var y2 = cellSize * this.height;
        ctx.fillRect(this.x, this.y, x2, y2);
    }
}

function addComp(x, y) {
    /* Adds a component to the map taking the values of the component control
    input on the HTML page. */
    
    var compColor = $("#compColor").val();
    var compWidth = $("#compWidth").val();
    var compHeight = $("#compHeight").val();

    var newComp = new component(x, y, compWidth, compHeight, compColor);
    compList.push(newComp);
}

function clearCompList() {
    /* Clears the components list, and the drawings on the map. */
    compList = [];
}

function importJson(button) {
    /* Imports a components list as a JSON file. */

    // Accepts only one file at a time
    var file = button[0];

    // Construct the file reader
    var reader = new FileReader();
    
    // Set the method to be called when a file is attached
    reader.onload = function(event) {
        // Parse the JSON file
        var jsonObj = JSON.parse(event.target.result);

        // Adds every item in the JSON file as a component
        jsonObj.forEach(importComp => {
            var newComp = new component(
                importComp.x, importComp.y, 
                importComp.width, importComp.height, 
                importComp.color);
            
            compList.push(newComp);
        });
    }

    // Instruct how to load the file (after this, the "onload" method will be called)
    reader.readAsText(file);
}

function exportJson(button) {
    /* Export the components list as a JSON file. */
    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(compList));
    button.setAttribute("href", "data:" + data);
    button.setAttribute("download", "mapExport.json");
}

function updateGameArea() {
    /* Updates the canvas information: clears the map, place the components
    of the components list and updates the cursor. */

    // Clear the canvas
    mapArea.clear();
    
    // Draw placed components
    compList.forEach(component => {
            component.update()
        });

    // Updates the cursor
    var alpha = "AA"; // The cursor component will be semitransparent
    var compColor = $("#compColor").val() + alpha;
    var compWidth = $("#compWidth").val();
    var compHeight = $("#compHeight").val();

    actualComp = new component(mapArea.x, mapArea.y, compWidth, compHeight, compColor);
    actualComp.update();
}

function startMap() {
    // Function to be called when the document loads
    mapArea.start();
}

function MouseCoords(e, canvasXY) {
    /* Get the cursor coordinates relative to the canvas position on the screen.
    Takes as parameters the event from the listener and the canvas bounding client
    rect. */

    // Cursor position relative to the canvas bounds.
    var relativeX = e.clientX - canvasXY.left;
    var relativeY = e.clientY - canvasXY.top;

    // Fit the coordinates to the grid
    var x = Math.floor(relativeX / cellSize) * cellSize;
    var y = Math.floor(relativeY / cellSize) * cellSize;

    // Verify that the cursor is inside the canvas
    var onScreenX = 0 <= x && x < canvasWidth;
    var onScreenY = 0 <= y && y < canvasHeight;

    var result = {x : x, y : y, onScreenX : onScreenX, onScreenY : onScreenY};

    return result;
}
