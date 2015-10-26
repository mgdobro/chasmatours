'use strict';

/**
 * @ngdoc function
 * @name flyersremorseApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the flyersremorseApp
 */
angular.module('app')
  .controller('ChartCtrl',['$scope', '$http', '$window', 'searchRequest', function ($scope, $http, $window, searchRequest) {

    $scope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };

    $scope.isDataDownloaded = false;
    $scope.showAlert = false;
    $scope.foundNoFares = false;
    $scope.firstValuesPresent = false;

    $scope.httpGetFinished = false;

    $scope.leadPriceFareRangeFinished = false;
    $scope.instaFlightFinished = false;

    $scope.isChartClicked = false;
    $scope.isFirstLoaded = false;

    $scope.isInstaFlightDownloading = true;

    $scope.StoredDayResponse = [];

    $scope.responseParams = {
      origin: '',
      arrival: '',
      departureDate: '',
      arrivalDate: '',
      lengthOfStay: '',
      currentDate: '',
      endOfCalendar: '',
      startIndexDay: '',
      endIndexDay: '',
      startClickedIndex: '',
      endClickedIndex: '',
      choosenDay: '',
      choosenEndOfStay: ''
    };

    $scope.fares = [];
    $scope.foundFares = [];
    $scope.choosenFare = {
      date: '',
      maxFare: '',
      minFare: '',
      medianFare: '',
      lowestFare: '',
      lowestNonStopFare: ''
    };

    $scope.selectedLowestFare = "Lowest Fare";
    $scope.selectedValue;

    $scope.$on('$viewContentLoaded', function () {
        searchFlights();
  });


$scope.getFares = function(){
    if($scope.fareRangeResponse != undefined){
      $scope.foundFares = [];
        for(var i = 0; i < $scope.fareRangeResponse.FareData.length; i++){
            removeNaN($scope.fareRangeResponse.FareData[i].MaximumFare);
            removeNaN($scope.fareRangeResponse.FareData[i].MinimumFare);
            removeNaN($scope.fareRangeResponse.FareData[i].MedianFare);
            removeNaN($scope.leadPriceCalResponse[i].fares[0].lowestFare);
            removeNaN($scope.leadPriceCalResponse[i].fares[0].lowestNonStopFare);

            $scope.foundFares.push( {
            "departureDate": $scope.leadPriceCalResponse[i].fares[0].departureDateTime.substring(0,10),
            "departure": $scope.fareRangeResponse.FareData[i].OriginLocation,
            "arrival": $scope.fareRangeResponse.FareData[i].DestinationLocation,
            "maxFare": $scope.fareRangeResponse.FareData[i].MaximumFare,
            "minFare": $scope.fareRangeResponse.FareData[i].MinimumFare,
            "medianFare": $scope.fareRangeResponse.FareData[i].MedianFare,
            "leadFare": $scope.leadPriceCalResponse[i].fares[0].lowestFare,
            "leadNonStopFare": $scope.leadPriceCalResponse[i].fares[0].lowestNonStopFare
        });
        }
    }

    if(!$scope.isDataDownloaded){
      drawChart();
    }
    $scope.setLowestFares();
    $scope.isDataDownloaded = true;

    $scope.validateForNoData();
};

function leadPriceCalSuccess(){
  if(!$scope.isDataDownloaded){
    $http.get($scope.leadPriceCalURL).success(function (result){
      $scope.leadPriceCalResponse = result;
      fareRangeSuccess();
    });
  } else{
    fareRangeSuccess();
  }
};

function fareRangeSuccess(){
  if(!$scope.isDataDownloaded){
    $http.get($scope.fareRangeURL).success(function (result){
      $scope.fareRangeResponse = result;

      $scope.leadPriceFareRangeFinished = true;

      if($scope.leadPriceFareRangeFinished && $scope.instaFlightFinished){
        $scope.isInstaFlightDownloading = false;
        $scope.viewFlights();
        if(!$scope.stopProcessing){
          $scope.setFirstChoosenValues();
          $scope.getFares();
        }
      }
    });
  } else{
      $scope.leadPriceFareRangeFinished = true;
      if($scope.leadPriceFareRangeFinished && $scope.instaFlightFinished){
        $scope.isInstaFlightDownloading = false;
        $scope.viewFlights();
        if(!$scope.stopProcessing){
          $scope.setFirstChoosenValues();
          $scope.getFares();
        }
      }
  }
};

function searchFlights(){
    if(typeof $scope.responseParams != 'undefined'){
        $('#loaderModal').modal({
          backdrop: 'static',
          keyboard: false
        });
        $scope.responseParams = searchRequest.getProperties();

        $scope.leadPriceCalURL = 'http://bridge2.sabre.cometari.com/shop/flights/fares?origin=' + $scope.responseParams.origin +
                        '&destination='+ $scope.responseParams.arrival +
                        '&lengthofstay='+ $scope.responseParams.lengthOfStay;

        $scope.getCurrentDate();

        $scope.fareRangeURL = 'http://bridge2.sabre.cometari.com/historical/flights/fares?origin=' + $scope.responseParams.origin +
                        '&destination='+ $scope.responseParams.arrival +
                        '&lengthofstay='+ $scope.responseParams.lengthOfStay +
                        '&earliestdeparturedate='+ $scope.responseParams.currentDate +
                        '&latestdeparturedate='+ $scope.responseParams.endOfCalendar;
        leadPriceCalSuccess();

        $scope.setInstaFlightURL($scope.responseParams.departureDate, $scope.responseParams.arrivalDate);
        $scope.viewFlights();
    }
}

$scope.getCurrentDate = function(){
  var currentDateRaw = moment();
  var currentDateFormat = currentDateRaw.format("YYYY-MM-DD");
  $scope.responseParams.currentDate = currentDateFormat;
};

$scope.getChoosenEndOfStay = function(){
  var userDay = moment($scope.responseParams.choosenDay);
  var choosenEndOfStayRaw = userDay.add($scope.responseParams.lengthOfStay, 'days');
  var choosenEndOfStayFormat = choosenEndOfStayRaw.format("YYYY-MM-DD");

  $scope.responseParams.choosenEndOfStay = choosenEndOfStayFormat;
};

$scope.setInstaFlightURL = function(startDay, endDay){
  $scope.instaFlightURL = 'http://bridge2.sabre.cometari.com/shop/flights?origin=' + $scope.responseParams.origin +
                          '&destination='+ $scope.responseParams.arrival +
                          '&departuredate='+ startDay +
                          '&returndate='+ endDay;
};

$scope.setFirstChoosenValues = function(event){
  var departureIndex = $scope.responseParams.startIndexDay + 1;
  removeNaN($scope.responseParams.departureDate);
  removeNaN($scope.fareRangeResponse.FareData[departureIndex].MinimumFare);
  removeNaN($scope.fareRangeResponse.FareData[departureIndex].MaximumFare);
  removeNaN($scope.fareRangeResponse.FareData[departureIndex].MedianFare);
  removeNaN($scope.leadPriceCalResponse[departureIndex].fares[0].lowestFare);
  removeNaN($scope.leadPriceCalResponse[departureIndex].fares[0].lowestNonStopFare);

  $scope.choosenFare.date = $scope.responseParams.departureDate;
  $scope.choosenFare.minFare = $scope.fareRangeResponse.FareData[departureIndex].MinimumFare;
  $scope.choosenFare.maxFare = $scope.fareRangeResponse.FareData[departureIndex].MaximumFare;
  $scope.choosenFare.medianFare = $scope.fareRangeResponse.FareData[departureIndex].MedianFare;
  $scope.choosenFare.lowestFare = $scope.leadPriceCalResponse[departureIndex].fares[0].lowestFare;
  $scope.choosenFare.lowestNonStopFare = $scope.leadPriceCalResponse[departureIndex].fares[0].lowestNonStopFare;

  $scope.firstValuesPresent = true;
};

function removeNaN(value){
  if(value !== value){
    value = 0;
  }
}

function drawChart(){
  $scope.chart = AmCharts.makeChart("mainChart", {
  "type": "serial",
  "dataDateFormat": "YYYY-MM-DD",
  "startDuration": 2,
  "startEffect": "elastic",
  "guides": [],
  "categoryField": "departureDate",
  "dataProvider": $scope.foundFares,

  categoryAxis: {
    id: 'c1',
    parseDates: true,
    minPeriod: 'DD',
    autoGridCount: false,
    gridCount: 50,
    gridAlpha: 0.1,
    minorGridEnabled: true,

    gridColor: "#024264",
    axisColor: '#024264',
    dateFormats: [{
        period: 'DD',
        format: 'DD'
    }, {
        period: 'WW',
        format: 'MMM DD'
    }, {
        period: 'MM',
        format: 'MMM'
    }, {
        period: 'YYYY',
        format: 'YYYY'
    }]
  },

  valueAxis: {
    id: "a1",
    title: "Fares",
    color: "#024264",
    gridAlpha: 0,
    axisAlpha: 0,
    "position": "left"
  },

pathToImages: "http://cdn.amcharts.com/lib/3/images/",

chartScrollbar: {
  selectedBackgroundColor: "#ffffff",
  backgroundColor: "#99c3bf"
},

graphs: [{
    id: "g1",
    valueAxis:  "a1",
    openField:  "minFare",
    valueField: "maxFare",
    title:  "Fare Range",
    type:  "column",
    fillAlphas:  0.9,
    balloonText:  "Fare Range: [[open]]$ - [[value]]$",
    legendValueText:  "Fare Range: [[open]]$ - [[value]]$",
    lineColor:  "#00807e",
    alphaField:  "alpha",
  },{
    id: "g2",
    valueAxis:  "a1",
    openField:  "medianFare",
    valueField: "medianFare",
    title:  "Median Fare",
    type:  "column",
    clustered: false,
    fillAlphas:  0.9,
    balloonText:  "Median Fare: [[value]]$",
    legendValueText:  "Median Fare: [[value]]$",
    lineColor:  "#f7eb1e",
    alphaField:  "alpha",
  },{
    id: "g3",
    valueAxis: "a1",
    startDuration: 2,
    startEffect: "elastic",
    title: "Lowest Fare",
    valueField: "leadFare",
    type: "line",
    lineColor: "#252e6d",
    lineThickness: 1.5,
    legendValueText: "Lowest Fare: [[value]]$",
    bullet: "round",
    balloonText: "Lowest Fare: [[value]]$",
    bulletBorderColor: "#252e6d",
    bulletBorderThickness: 1.5,
    bulletBorderAlpha: 1,
    dashLengthField: "dashLength",
    animationPlayed: "true",
  },{
    id: "g4",
    valueAxis: "a1",
    startDuration: 2,
    startEffect: "elastic",
    title: "Lowest Nonstop Fare",
    valueField: "leadNonStopFare",
    type: "line",
    lineColor: "#5ab8de",
    lineThickness: 1.5,
    legendValueText: "Lowest Nonstop Fare: [[value]]$",
    bullet: "round",
    balloonText: "Lowest Nonstop Fare: [[value]]$",
    bulletBorderColor: "#5ab8de",
    bulletBorderThickness: 1.5,
    bulletBorderAlpha: 1,
    dashLengthField: "dashLength",
    animationPlayed: "true",
  }],

  chartCursor: {
    zoomable: false,
    categoryBalloonDateFormat: "DD",
    cursorAlpha: 0,
    valueBalloonsEnabled: false
  },

  legend: {
    bulletType: "round",
    equalWidths: false,
    valueWidth: 450,
    useGraphSettings: true,
    color: "#FFFFFF"
  }
});

$scope.graphLeadNonStopFare = $scope.chart.graphs[3];
//$scope.chart.removeGraph(graphLeadNonStopFare);
$scope.graphLeadFare = $scope.chart.graphs[2];
//$scope.chart.removeGraph(graphLeadFare);

$scope.setLowestFares = function(){
  var combo = document.getElementById("select-fares");
  var selected = combo.options[combo.selectedIndex].text;
  if(selected == "Lowest Fare"){
    $scope.selectedValue = $scope.choosenFare.lowestFare;
  }else{
    $scope.selectedValue = $scope.choosenFare.lowestNonStopFare;
  }
}

$scope.handleGraphs = function(){
  var selObj = document.getElementById("select-fares");
  var selIndex = selObj.selectedIndex;
  if(selIndex == 0){
    $scope.chart.hideGraph($scope.graphLeadNonStopFare);
    $scope.selectedValue = $scope.choosenFare.lowestFare;
    $scope.chart.showGraph($scope.graphLeadFare);
  } else{
    $scope.chart.hideGraph($scope.graphLeadFare);
    $scope.selectedValue = $scope.choosenFare.lowestNonStopFare;
    $scope.chart.showGraph($scope.graphLeadNonStopFare);
  }
  zoomChart();
};

$scope.handleGraphs();

$scope.chart.addListener("rendered", zoomChart);
zoomChart();

function zoomChart() {
  if($scope.isChartClicked == true){
    $scope.chart.zoomToIndexes($scope.responseParams.startClickedIndex, $scope.responseParams.endClickedIndex);
  } else{
    $scope.chart.zoomToIndexes($scope.responseParams.startIndexDay + 1, $scope.responseParams.endIndexDay + 1);
  }
}

$scope.zoomChartOnClick = function(event){
  if($scope.isChartClicked == true){
    if(event.graph.id != 'g3' && event.graph.id != 'g4')
    {
      $scope.chart.zoomToIndexes($scope.responseParams.startClickedIndex, $scope.responseParams.endClickedIndex);
    }
  } else{
    $scope.chart.zoomToIndexes($scope.responseParams.startIndexDay + 1, $scope.responseParams.endIndexDay + 1);
  }
}

$scope.setChoosenValues = function(event){
  var index = event.index;
  $scope.responseParams.startClickedIndex = index;
  $scope.responseParams.endClickedIndex = index + 14;
  removeNaN($scope.fareRangeResponse.FareData[index].MinimumFare);
  removeNaN($scope.fareRangeResponse.FareData[index].MaximumFare);
  removeNaN($scope.fareRangeResponse.FareData[index].MedianFare);
  removeNaN($scope.leadPriceCalResponse[index].fares[0].lowestFare);
  removeNaN($scope.leadPriceCalResponse[index].fares[0].lowestNonStopFare);

  $scope.choosenFare.date = $scope.leadPriceCalResponse[index].fares[0].departureDateTime.substring(0,10);
  $scope.choosenFare.minFare = $scope.fareRangeResponse.FareData[index].MinimumFare;
  $scope.choosenFare.maxFare = $scope.fareRangeResponse.FareData[index].MaximumFare;
  $scope.choosenFare.medianFare = $scope.fareRangeResponse.FareData[index].MedianFare;
  $scope.choosenFare.lowestFare = $scope.leadPriceCalResponse[index].fares[0].lowestFare;
  $scope.choosenFare.lowestNonStopFare = $scope.leadPriceCalResponse[index].fares[0].lowestNonStopFare;
}

AmCharts.doClick = function (event) {
  $('#loaderModal').modal('show');
  $scope.isInstaFlightDownloading = true;

  var div = document.getElementById("events");

 // var choosenDayRaw = event.item.category.toISOString().substr(0,10);
 // $scope.responseParams.choosenDay = moment(choosenDayRaw, "YYYY-MM-DD").add(1, 'days').format("YYYY-MM-DD");
  $scope.responseParams.choosenDay = moment(new Date(event.item.category.toString())).format("YYYY-MM-DD");


  $scope.setChoosenValues(event);
  $scope.isChartClicked = true;

  $scope.getChoosenEndOfStay();

  $scope.setInstaFlightURL($scope.responseParams.choosenDay, $scope.responseParams.choosenEndOfStay);
  $scope.viewFlights();
  $scope.setLowestFares();
  $scope.$apply();

  $scope.validateForNoData();
  $scope.zoomChartOnClick(event);
}

// $scope.setLowestFares = function(){
//   var combo = document.getElementById("select-fares");
//   var selected = combo.options[combo.selectedIndex].text;
//   if(selected == "Lowest Fare"){
//     $scope.selectedValue = $scope.choosenFare.lowestFare;
//   }else{
//     $scope.selectedValue = $scope.choosenFare.lowestNonStopFare;
//   }
// }

// $scope.handleGraphs = function(){
//   var selObj = document.getElementById("select-fares");
//   var selIndex = selObj.selectedIndex;
//   if(selIndex == 0){
//     $scope.chart.removeGraph(graphLeadNonStopFare);
//     $scope.selectedValue = $scope.choosenFare.lowestFare;
//     $scope.chart.addGraph(graphLeadFare);
//   } else{
//     $scope.chart.removeGraph(graphLeadFare);
//     $scope.selectedValue = $scope.choosenFare.lowestNonStopFare;
//     $scope.chart.addGraph(graphLeadNonStopFare);
//   }
//   zoomChart();
// };

$scope.chart.addListener("clickGraphItem", AmCharts.doClick);
// $scope.handleGraphs();
};

$scope.isDayResponseStored = function(){
  if(getByValue($scope.StoredDayResponse, $scope.responseParams.choosenDay) !== undefined){
    return true;
  } else{
    return false;
  }
}

function getByValue(array, value) {
  for (var i=0, iLen=array.length; i<iLen; i++) {
    if (array[i].day == value) return array[i];
  }
}

$scope.validateForNoData = function(){
  if($scope.choosenFare.lowestFare === "N/A"){
    $scope.choosenFare.lowestFare = "unknown";
  }
  if($scope.choosenFare.lowestNonStopFare === "N/A"){
    $scope.choosenFare.lowestNonStopFare = "unknown";
  }
}

$scope.closeAlert = function(){
  $('#alertModal').modal('hide');
  $window.location.href = '';
}

$scope.redirectToHome = function(){
  if (!$('#alertModal').is(':visible')) {
    $window.location.href = '';
  }
}

 $scope.viewFlights = function(){
    if(typeof $scope.responseParams != 'undefined'){
      if($scope.isInstaFlightDownloading){

        if(!$scope.isDayResponseStored()){
          $http.get($scope.instaFlightURL).success(function (result){
            $scope.successResult = result;
            if($scope.isFirstLoaded){
              $scope.StoredDayResponse.push({'day': $scope.responseParams.choosenDay, 'InstaFlightResponse': result});
            } else{
              $scope.StoredDayResponse.push({'day': $scope.responseParams.departureDate, 'InstaFlightResponse': result});
            }
            $scope.isFirstLoaded = true;
            $scope.makeTable(result);
          });
        } else{
          var storedResponse = getByValue($scope.StoredDayResponse, $scope.responseParams.choosenDay);
          $scope.makeTable(storedResponse.InstaFlightResponse);
        }
      } else{
        $scope.makeTable($scope.successResult);
      }

    $scope.makeTable = function(result){
      $scope.httpGetFinished = true;
      $scope.instaFlightFinished = true;
      if($scope.leadPriceFareRangeFinished && $scope.instaFlightFinished){
      $scope.instaFlightResponse = {
        PricedItineraries: []
      };

      $scope.instaFlightResponse = result;

      $scope.myFlights = [];
      var changes = "";
      var changesB = "";
      var flightTime;
      var flightTimeB;

        if($scope.instaFlightResponse.PricedItineraries != undefined){
           for(var j = 0; j < $scope.instaFlightResponse.PricedItineraries.length; j++){
                    $scope.flightSegments = [];
                    $scope.flightSegmentsB = [];
                    if( $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment.length == 1 ){
                        changes = "non stop"
                    }else if($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment.length == 2) {
                         changes = "1 stop"
                    }else {
                        changes = $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment.length + "stops"
                    };
                    if( $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment.length == 1 ){
                        changesB = "non stop"
                    }else if($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment.length == 2) {
                         changesB = "1 stop"
                    }else {
                        changesB = $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment.length + "stops"
                    };
                    for(var i = 0, k = $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment.length; i<k; i++){
                            $scope.flightSegments.push({
                                departureAirport: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[i].DepartureAirport.LocationCode,
                                departureTime: ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[i].DepartureDateTime).substring(11,16),
                                arrivalAirport: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[i].ArrivalAirport.LocationCode,
                                arrivalTime: ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[i].ArrivalDateTime).substring(11,16),
                                length: parseInt($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[i].ElapsedTime/60) + " h  " + $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[i].ElapsedTime % 60  + " min",
                                airline: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[i].MarketingAirline.Code,
                                flightNo: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[i].FlightNumber
                            });
                    };
                    for(var i = 0, k = $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment.length; i<k; i++){
                            $scope.flightSegmentsB.push({
                                departureAirport: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[i].DepartureAirport.LocationCode,
                                departureTime: ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[i].DepartureDateTime).substring(11,16),
                                arrivalAirport: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[i].ArrivalAirport.LocationCode,
                                arrivalTime: ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[i].ArrivalDateTime).substring(11,16),
                                length: parseInt($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[i].ElapsedTime/60) + " h  " + $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[i].ElapsedTime % 60  + " min",
                                airline: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[i].MarketingAirline.Code,
                                flightNo: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[i].FlightNumber
                            });
                    };
                    flightTime = parseInt($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].ElapsedTime/60) + " h  " + $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].ElapsedTime % 60 + " min" ;
                    flightTimeB = parseInt($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].ElapsedTime/60) + " h  " + $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].ElapsedTime % 60 + " min" ;

                $scope.myFlights.push({
                    open: false,
                    origin: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[0].DepartureAirport.LocationCode,
                    destination:  $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[0].DepartureAirport.LocationCode,
                    departureDate:  ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[0].DepartureDateTime).substring(0,10),
                    departureTime: ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[0].DepartureDateTime).substring(11,16),
                    arrivalDate: ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[0].ArrivalDateTime).substring(0,10),
                    arrivalTime: ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[0].ArrivalDateTime).substring(11,16),
                    noChanges:  changes,
                    carrier: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[0].MarketingAirline.Code,
                    flightLength: flightTime,
                    flightNo:   $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[0].FlightSegment[0].FlightNumber,
                    departureDateB: ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[0].DepartureDateTime).substring(0,10),
                    departureTimeB:  ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[0].DepartureDateTime).substring(11,16),
                    arrivalDateB: ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[0].ArrivalDateTime).substring(0,10),
                    arrivalTimeB: ($scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[0].ArrivalDateTime).substring(11,16),
                    noChangesB: changesB,
                    carrierB: $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[0].MarketingAirline.Code,
                    flightLengthB: flightTimeB,
                    flightNoB:  $scope.instaFlightResponse.PricedItineraries[j].AirItinerary.OriginDestinationOptions.OriginDestinationOption[1].FlightSegment[0].FlightNumber,
                    totalFare: $scope.instaFlightResponse.PricedItineraries[j].AirItineraryPricingInfo.ItinTotalFare.TotalFare.Amount,
                    currency: $scope.instaFlightResponse.PricedItineraries[j].AirItineraryPricingInfo.ItinTotalFare.TotalFare.CurrencyCode,
                    segments: $scope.flightSegments,
                    segmentsB: $scope.flightSegmentsB
                    });
              };
                $scope.stopProcessing = true;
                $('#loaderModal').modal('hide');

                if($scope.firstValuesPresent){
                  $scope.getFares();
                } else{
                  $scope.setFirstChoosenValues();
                  $scope.getFares();
                }
                $scope.firstValuesPresent = true;
        }else{
          $scope.stopProcessing = true;
          $scope.httpGetFinished = true;
          $scope.foundNoFares = true;
          $scope.instaFlightFinished = true;
          if($scope.leadPriceFareRangeFinished && $scope.instaFlightFinished){
            $('#loaderModal').modal('hide');
          }
          $('#alertModal').modal({
            backdrop: 'static',
            keyboard: false
          });
          $('#alertModal').modal('show');
        };
      };
    }
};
};
}
]);
