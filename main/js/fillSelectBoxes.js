/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Fill Cancer Type Select Box (below) /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

fillSelectBoxes = {}
fillSelectBoxes.cancerSelect = {}
fillSelectBoxes.clinicalFeatureSelect = {}
fillSelectBoxes.geneSelect = {}
fillSelectBoxes.mutationSelect = {}

// Returns an array of JSON objects, where each object has a key:value pair for 
// "cohort" (e.g., "BRCA") and "description" (e.g., "Breast invasive carcioma")
fillSelectBoxes.cancerSelect.fetchCohortData = async() => {
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl='http://firebrowse.org/api/v1/Metadata/Cohorts';
    const endpointurl_presets = {format: 'json'};
    const endpointurl_fieldsWithValues = 'format=' + endpointurl_presets.format;
    let fetchedCohortData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues).then(function(response) { return response.json(); });
    if (fetchedCohortData == '')              
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        console.log(fetchedCohortData["Cohorts"])
        return fetchedCohortData["Cohorts"];
    }
}

fillSelectBoxes.cancerSelect.fillCancerTypeSelectBox = async() => {
    let cancerTypesQuery = await fillSelectBoxes.cancerSelect.fetchCohortData();
    cancerTypesQuery.sort();
    let selectBox = document.getElementById("cancerTypeMultipleSelection");
    for (let i = 0; i < cancerTypesQuery.length; i++) {
        let currentOption = document.createElement("option");
        currentOption.value = cancerTypesQuery[i]["cohort"];
        currentOption.text = "(" + cancerTypesQuery[i]["cohort"] + ") " + cancerTypesQuery[i]["description"];
        currentOption.id = cancerTypesQuery[i]["cohort"];
        selectBox.appendChild(currentOption);
    }
    let cancerTypeSelectedOptions = localStorage.getItem("cancerTypeSelectedOptions").split(',');
    if(cancerTypeSelectedOptions){
        $('.cancerTypeMultipleSelection').val(cancerTypeSelectedOptions);
        fillClinicalTypeSelectBox();
    }
};

fillSelectBoxes.cancerSelect.fetchNumberSamples = async() => {
    let myCohort = $('.cancerTypeMultipleSelection').select2('data').map(cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
    console.log(myCohort)
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl='http://firebrowse.org/api/v1/Metadata/Counts'; //sample remainder of URL is: ?format=json&cohort=PRAD&fh_cde_name=psa_value&page=1&page_size=250&sort_by=cohort
    const endpointurl_presets = {
        cohort: myCohort,
        sample_type: 'TP',
        data_type: 'mrnaseq',
        totals: 'true'
    };
    const endpointurl_fieldsWithValues = 
        '&cohort=' + endpointurl_presets.cohort.toString() +
        '&sample_type=' + endpointurl_presets.sample_type + 
        '&data_type=' + endpointurl_presets.data_type + 
        '&totals=' + endpointurl_presets.totals;
    var fetchedCountData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues).then(function(response) { return response.json(); });
    if (fetchedCountData == '')
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return fetchedCountData;
    }
}

fillSelectBoxes.cancerSelect.displayNumberSamples = async() => {
    if(document.getElementById('erikaPara')) {
        document.getElementById('erikaPara').remove();
    }
    let myCohort = $('.cancerTypeMultipleSelection').select2('data').map(cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
    var dataFetched = await fillSelectBoxes.cancerSelect.fetchNumberSamples();
    var countQuery = dataFetched.Counts;
    let string = "";
    let para;
    for(let i = 0; i < countQuery.length; i++) {
        if(string == "") {
            string += myCohort[i] + ": " + countQuery[i].mrnaseq;  
            para = document.createElement("P");
            para.setAttribute('style', 'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif');
            para.setAttribute('id', 'erikaPara');        
            para.innerText = "Number of samples: " + string;  
            cancerQuerySelectBox.appendChild(para);
        } else {
            document.getElementById('erikaPara').remove();
            string += ", " + myCohort[i] + ": " + countQuery[i].mrnaseq;
            para.setAttribute('style', 'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif');
            para.setAttribute('id', 'erikaPara');        
            para.innerText = "Number of samples: " + string;         
            cancerQuerySelectBox.appendChild(para);
        }
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Fill Cancer Type Select Box (above) /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Gene ID Select Box (below) ///////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

fillSelectBoxes.geneSelect.getValidGeneList = async() => {
    let validGeneList = await fetch("https://raw.githubusercontent.com/web4bio/webgen/master/main/validGeneList.json").then(response => response.json());
    validGeneList = validGeneList.map(geneInfo => geneInfo.hugoSymbol);
    return await validGeneList
}

fillSelectBoxes.geneSelect.fillGeneSelectBox = async() => {
    let geneList = await fetch("https://raw.githubusercontent.com/web4bio/webgen/master/main/geneList.json").then(response => response.json())
    let selectBox = document.getElementById("geneMultipleSelection");
    for(let i = 0; i < geneList.length; i++) {
        let currentOption = document.createElement("option");
        currentOption.value = geneList[i].hugoSymbol;
        currentOption.text = geneList[i].hugoSymbol;
        currentOption.id = geneList[i].hugoSymbol;
        selectBox.appendChild(currentOption);
    }

    let geneOptions = localStorage.getItem("geneOptions").split(',');
    if(geneOptions){
        $('.geneMultipleSelection').val(geneOptions)
        fillMutationSelectBox()
        let mutationOptions = localStorage.getItem("mutationOptions").split(',');
        if(mutationOptions){
            console.debug(mutationOptions)
            $('.mutationMultipleSelection').val(mutationOptions)
        }
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Gene ID Select Box (above) ///////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Clinical Select Box (below) //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

fillSelectBoxes.clinicalFeatureSelect.getBarcodesFromCohortForClinical = async function () {
    let myCohort = $('.cancerTypeMultipleSelection').select2('data').map(cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
    var dataFetched = await fetchExpressionData_cg(myCohort, 'bcl2');
    console.log(dataFetched)
    var results = dataFetched.mRNASeq;
    let tpBarcodes = [];
    results.forEach(element => tpBarcodes.push(element.tcga_participant_barcode));
    return tpBarcodes;
};

fillSelectBoxes.clinicalFeatureSelect.fetchClinicalData = async() => {
    let barcodes = await fillSelectBoxes.clinicalFeatureSelect.getBarcodesFromCohortForClinical();
    let clinicalData = await firebrowse.getClinical_FH(barcodes);
    console.log(clinicalData)
    if (clinicalData == '')
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return clinicalData;
    }
};

let clinicalQuery;
fillSelectBoxes.clinicalFeatureSelect.fillClinicalTypeSelectBox = async() => {
    let dataFetched = await fillSelectBoxes.clinicalFeatureSelect.fetchClinicalData();
    clinicalQuery = dataFetched.Clinical_FH;
    console.log(clinicalQuery)
    let selectBox = document.getElementById("clinicalMultipleSelection");
    let clinicalKeys = Object.keys(clinicalQuery[0]);
    for (let i = 0; i < clinicalKeys.length; i++) {
        let currentOption = document.createElement("option");
        currentOption.value = clinicalKeys[i];
        currentOption.text = clinicalKeys[i];
        currentOption.id = clinicalKeys[i];
        selectBox.appendChild(currentOption);
    }
    
    let clinicalFeatureOptions = localStorage.getItem("clinicalFeatureOptions").split(',');
    if(clinicalFeatureOptions){
        $('.clinicalMultipleSelection').val(clinicalFeatureOptions)
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Clinical Select Box (above) //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Mutation Select Box (below) ///////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

fillSelectBoxes.mutationSelect.fetchMutationData = async() => {
    let myGeneQuery = $('.geneMultipleSelection').select2('data').map(geneInfo => geneInfo.text);
    let myCohortQuery = $('.cancerTypeMultipleSelection').select2('data').map(cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl='http://firebrowse.org/api/v1/Analyses/Mutation/MAF';
    const endpointurl_presets = {
        format: 'json',
        cohort: myCohortQuery,  
        tool: 'MutSig2CV', 
        gene: myGeneQuery,  
        page: '1',
        page_size: 250,
        sort_by: 'cohort' 
    };
    const endpointurl_fieldsWithValues = 
        'format=' + endpointurl_presets.format + 
        '&cohort=' + endpointurl_presets.cohort.toString() + 
        '&tool=' + endpointurl_presets.tool + 
        '&gene=' + endpointurl_presets.gene +
        '&page=' + endpointurl_presets.page + 
        '&page_size=' + endpointurl_presets.page_size.toString() + 
        '&sort_by=' + endpointurl_presets.sort_by;
    let fetchedMutationData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues).then(function(response) { return response.json(); });
    if (fetchedMutationData == '')              
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return fetchedMutationData;
    }
}

fillSelectBoxes.mutationSelect.fillMutationSelectBox = async() => {
    let mutationQuery = await fillSelectBoxes.mutationSelect.fetchMutationData();
    console.log(mutationQuery.MAF)
    let theMutationQuery = mutationQuery.MAF;
    let selectBox = document.getElementById("mutationMultipleSelection");
    while(selectBox.firstChild) {
        selectBox.removeChild(selectBox.firstChild);
    }
    let allVariantClassifications = [];
    for (let i = 0; i < theMutationQuery.length; i++) 
        allVariantClassifications.push(theMutationQuery[i].Variant_Classification)
    function getUniqueValues(value, index, self) { 
        return self.indexOf(value) === index;
    }
    let uniqueVariantClassifications = allVariantClassifications.filter(getUniqueValues);
    for (let i = 0; i < uniqueVariantClassifications.length; i++) {
        console.debug(uniqueVariantClassifications[i])
        let currentOption = document.createElement("option");
        currentOption.value = uniqueVariantClassifications[i];
        currentOption.text = uniqueVariantClassifications[i];
        currentOption.id = uniqueVariantClassifications[i];
        selectBox.appendChild(currentOption);
    }
    return;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Mutation Select Box (above) ///////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

fillSelectBoxes.saveInLocalStorage = async function() {
    let cancerTypeSelectedOptions = $('.cancerTypeMultipleSelection').select2('data').map(cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
    localStorage.setItem("cancerTypeSelectedOptions", cancerTypeSelectedOptions);

    let clinicalFeatureOptions = $('.clinicalMultipleSelection').select2('data').map(clinicalFeature => clinicalFeature.text);
    localStorage.setItem("clinicalFeatureOptions", clinicalFeatureOptions);

    let geneOptions = $('.geneMultipleSelection').select2('data').map(gene => gene.text);
    localStorage.setItem("geneOptions", geneOptions);

    let mutationOptions = $('.mutationMultipleSelection').select2('data').map(clinicalFeature => clinicalFeature.text);
    localStorage.setItem("mutationOptions", mutationOptions);
}