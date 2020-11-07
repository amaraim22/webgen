plotCreation.buildDataExplorePlots = async function() {

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    let mySelectedClinicalFeatures = $('.clinicalMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.text);

    let currentFeature = mySelectedClinicalFeatures[mySelectedClinicalFeatures.length-1];

    let allX = []; 
    for(let i = 0; i < clinicalQuery.length; i++) {
        allX.push(clinicalQuery[i][currentFeature]);
    }

    let uniqueX = allX.filter(onlyUnique);

    let xCounts = [];
    xCounts.length = uniqueX.length;
    for(let i = 0; i < xCounts.length; i++)
    xCounts[i] = 0;
    
    for(let i = 0; i < clinicalQuery.length; i++) 
        for(let k = 0; k < uniqueX.length; k++) 
            if(clinicalQuery[i][currentFeature] == uniqueX[k]) 
                xCounts[k]++;

    var data = [{
        values: xCounts,
        labels: uniqueX,
        type: 'pie',
        textinfo: "label+percent",
        textposition: "outside",
        marker: {
            colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
            '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
            line: {
                color: 'black', 
                width: 1
            }
        }
    }];
    
    var layout = {
        height: 400,
        width: 500,
        title: currentFeature + "",
        showlegend: false,
        extendpiecolors: true
    };

    let parentRowDiv = document.getElementById("dataexploration");        
    let newDiv = document.createElement("div");
    newDiv.setAttribute("class", "col s4");
    newDiv.setAttribute("id", currentFeature + "Div");
    parentRowDiv.appendChild(newDiv);
    
    Plotly.newPlot(currentFeature + 'Div', data, layout);

    document.getElementById(currentFeature + 'Div').on('plotly_click', function(data) {
        var pts = '';
        var colore;
        var tn = '';
        for(let i = 0; i < data.points.length; i++) {
            pts = data.points[i].pointNumber;
            tn = data.points[i].curveNumber;
            colore = data.points[i].data.marker.colors;
        }
        colore[pts] = '#FFF34B';
        var update = {'marker': {colors: colore, 
                                line: {color: 'black', width: 1}}};
        Plotly.restyle(currentFeature + 'Div', update, [tn]);
    });

}