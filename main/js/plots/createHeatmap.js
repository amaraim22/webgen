// Async function to create a d3 heatmap for a given independent variable and a set of genes

// indepVarType is the type of independent variable for the plot (such as 'cohort' or 'mutatedGene')
    // NOTE: The function is currently only set to handle indepVarType='cohort'
// indepVar is the independent variable (ex1: 'PAAD', ex2: 'TP53')
// dataInput is the array os JSONs of gene expression data to visualize
// svgObject is the object on the html page to build the plot
 
createHeatmap = async function(indepVarType, indepVars, dataInput, svgObject) {

    // Set up the figure dimensions:
    let margin = {top: 80, right: 30, bottom: 30, left: 60},
        width = 1250 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Set the columns to be the set of TCGA participant barcodes 'myGroups' and the rows to be the set of expression z-score's called 'myVars'
    let myGroups = d3.map(dataInput, function(d){return d.tcga_participant_barcode;}).keys();
    let myVars = d3.map(dataInput, function(d){return d.gene;}).keys();

    // DATA CLUSTERING:
    // extract relevant fields: tcga id, expression level, gene name
    // unique_genes ~should~ be based on geneQuery, not a global yet so just find unique genes of the data array
    var unique_genes = myVars //d3.map(dataInput, function(d){return d.gene;}).keys();
    var unique_ids = d3.map(dataInput, function(d){return d.tcga_participant_barcode}).keys();
    
    var data_raw = dataInput.map(({tcga_participant_barcode, expression_log2, gene}) => ({id:tcga_participant_barcode, exp:expression_log2, gene, geneInd:unique_genes.indexOf(gene)}))

    var data_merge = unique_ids.map(function (str) {
        //var arr = _.filter(data_raw, {id: str});
        var arr = data_raw.filter(samp => samp.id.includes(str))
        return {id:arr[0].id,
                dist:arr.reduce( (acc,samp) => { acc[samp.geneInd] = samp.exp; return acc},[]),
                genes:arr.reduce( (acc,samp) => { acc[samp.geneInd] = samp.gene; return acc},[])}
    })
    
    // call clustering function from hclust library
    //var clust_results = hclust.clusterData({data: data_merge, key: 'dist'})
    var clust_results = clusterData({data: data_merge, key: 'dist'})

    // extract order from clust_results, use to reorder myGroups
    const sortOrder = clust_results.order
    myGroups = sortOrder.map(i => myGroups[i])


    ///// Build the Axis and Color Scales Below /////
    // Build x scale and axis for heatmap::
    let x = d3.scaleBand()
        .range([ 0, width-50 ])
        .domain(myGroups)
        .padding(0.0);

    // Append x axis for the heatmap:
    svgObject.append("g")
        .style("font-size", 15)
        .attr("transform", "translate(0," + height + ")")
        .select(".domain").remove()

    // Build y scale and axis for heatmap:
    let y = d3.scaleBand()
        .range([ height, 0 ])
        .domain(myVars)
        .padding(0.0);

    // Append the y axis for the heatmap:
    svgObject.append("g")
        .style("font-size", 9.5)
        .call(d3.axisLeft(y).tickSize(0))
        .select(".domain").remove()

    // Define minZ and maxZ for the color interpolator (this may become a user defined value later on):
    let minZ = -2
    let maxZ = 2

    // Position scale for the legend:
    let yScale = d3.scaleLinear().domain([minZ, maxZ]).range([height,0]);
    let legendAxis = d3.axisRight()
        .scale(yScale)
        .tickSize(5)
        .ticks(5)
    
    // Append the axis for the legend:
    svgObject.append("g")
        .style("font-size",10)
        .attr("transform", "translate("+ width + ',' + 0 + ")")
        .call(legendAxis)

    // Create arr array to build legend:
    let arr = [];
    let step = (maxZ - minZ) / (1000 - 1);
    for(var i = 0; i < 1000; i++) {
      arr.push(minZ + (step * i));
    };

    // Build color scale
    interpolateRdBkGn = d3.interpolateRgbBasis(["blue","white","red"])
    let myColor = d3.scaleSequential()
        .interpolator(interpolateRdBkGn)    // A different d3 interpolator can be used here for a different color gradient
        .domain([minZ, maxZ])               // This domain scale will change the coloring of the heatmap.
    
    
    
    ///// Build the Mouseover Tool Below /////
    // Build the scroll over tool:
    // create a tooltip svg div
    let tooltip = d3.select("#heatmapRef")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    // Three function that change the tooltip when user hover / move / leave a cell
    let mouseover = function(d) {
        tooltip
        .style("opacity", 1)
        d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)
    }
    const spacing = "\xa0\xa0\xa0\xa0|\xa0\xa0\xa0\xa0";
    let mousemove = function(d) {
        tooltip
        // Choose what the tooltip will display (this can be customized to display other data):
        .html("\xa0\xa0" + 
            "Cohort: " + d.cohort + spacing +
            "TCGA Participant Barcode: " + d.tcga_participant_barcode + spacing +
            "Gene: " + d.gene + spacing +
            "Expression Level (log2): " + d.expression_log2.toFixed(5) + spacing + 
            "Expression Z-Score: " + d["z-score"].toFixed(5))
        .style("left", (d3.mouse(this)[0]+70) + "px")
        .style("top", (d3.mouse(this)[1]) + "px")
    }
    let mouseleave = function(d) {
        tooltip
        .style("opacity", 0)
        d3.select(this)
        .style("stroke", "none")
    }


    ///// Build the Heatmap with Legend Below /////
    // Build the heatmap:
    svgObject.selectAll()
        .data(dataInput, function(d) {return d.tcga_participant_barcode+':'+d.gene;})
        .enter()
        .append("rect")
        .attr("x", function(d) {return x(d.tcga_participant_barcode) })
        .attr("y", function(d) {return y(d.gene) })
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", function(d) {return myColor(d["z-score"])} )
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 1)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        
    // Build the Legend:   
    svgObject.selectAll()
        .data(arr)
        .enter()
        .append('rect')
        .attr('x', 1130)
        .attr('y', function(r) { return yScale(r) })
        .attr("width", 25)
        .attr("height", 1 + (height/arr.length) )
        .style("fill", function(r) {return myColor(r)} )
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 1)


    ///// Set the Heatmap Title Below /////
    // Add title to graph listing genes
    svgObject.append("text")
        .attr("x", 0)
        .attr("y", -25)
        .attr("text-anchor", "left")
        .style("font-size", "26px")
        .text("Gene Expression Heatmap for "+indepVars.join(' and '))

};