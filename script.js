const $ = require ("jquery");
const fs = require ("fs");
const { data } = require("jquery");
const { dialog } = require('electron').remote

$(document).ready(function(){
    let db;

    $(".row .cell").on("click", function(){
        let ri = Number($(this).attr("ri"));
        let ci = Number($(this).attr("ci"));

        $("#address-input").val(String.fromCharCode(65+ci)+(ri+1));
        $("#formula-input").val(db[ri][ci].formula);
    });

    $(".row .cell").on("blur", function(){
        let ri = Number($(this).attr("ri"));
        let ci = Number($(this).attr("ci"));

        let cellObject = {
            rowId: ri,
            colId: ci
        };

        if (db[ri][ci].value == $(this).text())
            return;
        
        if (db[ri][ci].formula)
        {
            removeFormula (cellObject);
            $("#formula-input").val("");
        }

        updateCell (cellObject, $(this).text());
        
    });

    $("#new").on("click", function(){
        db = [];

        let rows = $(".row");

        for (let i=0;i<rows.length;i++)
        {
            let cols = $(rows[i]).find(".cell");
            let row = [];

            for (let j=0;j<cols.length;j++)
            {
                $(cols[j]).text("");

                row.push({
                    value: "",
                    formula: "",
                    downstream: [],
                    upstream: []
                });
            }

            db.push(row);
        }

        $(`.row .cell[ri = ${0}][ci = ${0}]`).trigger("click");
    });

    $("#open").on("click", async function(){
        let dialogBox = await dialog.showOpenDialog();
        let JSONData = fs.readFileSync (dialogBox.filePaths[0]);
        db = JSON.parse(JSONData);
        
        let rows = $(".row");

        for (let i=0;i<rows.length;i++)
        {
            let cols = $(rows[i]).find(".cell");

            for (let j=0;j<cols.length;j++)
            {
                $(cols[j]).text(db[i][j].value);
            }
        }
    });

    $("#save").on("click", async function(){
        let dialogBox = await dialog.showOpenDialog();
        let JSONData = JSON.stringify(db);
        fs.writeFileSync(dialogBox.filePaths[0], JSONData);
    });

    $("#formula-input").on("blur", function(){
        let cellAddress = $("#address-input").val();
        let cellObject = findCellObject (cellAddress);
        let formula = $("#formula-input").val();

        if (db[cellObject.rowId][cellObject.colId].formula == $(this).val())
            return;

        if (db[cellObject.rowId][cellObject.colId].formula)
        {
            removeFormula (cellObject);
            $(this).val(formula);    
        }

        console.log (formula);
        if (formula=="")
            updateCell (cellObject, "");
        else
        {
            setupFormula (cellObject, formula);
            let rVal = evaluateFormula (cellObject);

            updateCell (cellObject, rVal);
        }
    });

    function setupFormula (cellObject, formula)
    {
        db[cellObject.rowId][cellObject.colId].formula = formula;
        let formulaArray = formula.split (" ");

        for (let i=0;i<formulaArray.length;i++)
        {
            if (formulaArray[i].charCodeAt(0)>=65 && formulaArray[i].charCodeAt(0)<=90)
            {
                let parentCellObject = findCellObject (formulaArray[i]);

                let databaseParentObject = db[parentCellObject.rowId][parentCellObject.colId];
                databaseParentObject.downstream.push(cellObject);

                let databaseCellObject = db[cellObject.rowId][cellObject.colId];
                databaseCellObject.upstream.push(parentCellObject);
            }
        }
    }

    function updateCell (cellObject, rVal)
    {
        db[cellObject.rowId][cellObject.colId].value = rVal;
        $(`.row .cell[ri=${cellObject.rowId}][ci=${cellObject.colId}]`).text (rVal);

        // this is dfs now

        let databaseObject = db[cellObject.rowId][cellObject.colId];
        for (let i=0;i<databaseObject.downstream.length;i++)
        {
            let rVal = evaluateFormula (databaseObject.downstream[i]);
            
            updateCell (databaseObject.downstream[i], rVal);
        }
    }

    function evaluateFormula (cellObject)
    {
        let formula = db[cellObject.rowId][cellObject.colId].formula;
        let formulaArray = formula.split (" ");

        for (let i=0;i<formulaArray.length;i++)
        {
            if (formulaArray[i].charCodeAt(0)>=65 && formulaArray[i].charCodeAt(0)<=90)
            {
                let parentCellObject = findCellObject (formulaArray[i]);

                let databaseParentObject = db[parentCellObject.rowId][parentCellObject.colId];

                formula = formula.replace (formulaArray[i], (databaseParentObject.value == "")? 0 : databaseParentObject.value);
            }
        }

        let rVal = eval (formula);  // implemented how using infix? (explanation of infix is important) graph cycle check is important also, save format is also asked
        return rVal;
    }

    function removeFormula (cellObject)
    {
        let databaseCellObject = db[cellObject.rowId][cellObject.colId];

        for (let i=0;i<databaseCellObject.upstream.length;i++)
        {
            let parentCellObject = databaseCellObject.upstream[i];

            let databaseParentObject = db[parentCellObject.rowId][parentCellObject.colId];

            let newParentDownstream = [];

            for (let j=0;j<databaseParentObject.downstream.length;j++)
            {
                if ((databaseParentObject.downstream[j].rowId != cellObject.rowId) || (databaseParentObject.downstream[j].colId != cellObject.colId))
                    newParentDownstream.push (databaseParentObject.downstream[j]);
            }

            databaseParentObject.downstream = newParentDownstream;
        }

        // clear formula
        databaseCellObject.formula = "";
        //clear upstream
        databaseCellObject.upstream = [];
    }

    function findCellObject (cellAddress)
    {
        let colId = cellAddress.charCodeAt(0) - 65;
        let rowId = Number(cellAddress.substring(1)) - 1;
        return {rowId, colId};
    }

    function init()
    {
        $("#new").trigger("click");
    }

    init();
});