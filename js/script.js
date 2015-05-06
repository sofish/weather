var body = document.body;

// find a right icon
var icon = (function(code) {
  var map = {
    '01d': 'wi-day-sunny',  	        // clear sky
    '02d': 'wi-day-cloudy',  	        // few clouds
    '03d': 'wi-cloud',  	            // scattered clouds
    '04d': 'wi-cloudy',  	            // broken clouds
    '09d': 'wi-rain',  	              // shower rain
    '10d': 'wi-day-rain',  	          // rain
    '11d': 'wi-lightning',  	        // thunderstorm
    '13d': 'wi-snow-wind',            // snow
    '50d': 'wi-fog',                  // mist
    '01n': 'wi-stars',
    '02n': 'wi-night-alt-cloudy',
    '03n': 'wi-cloud',
    '04n': 'wi-night-cloudy',
    '09n': 'wi-night-alt-rain',
    '10n': 'wi-night-alt-rain',
    '11n': 'wi-lightning',
    '13n': 'wi-snow-wind',
    '50n': 'wi-fog'
  };
  
  return function weatherIcon(code) {
    return map[code] || 'wi-cloud-refresh';
  };
})();

// map week
var day = (function() {
  var map = ['Sun', 'Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat'];
  return function(index) {
    return map[index];
  };
})();


// is the app installed on home screen
void function standalone() {
  if(navigator.standalone) body.classList.add('standalone');
}();

// fetch data
void function weather() {
  var script = document.createElement('script');
  var fish = document.querySelector('#fish');
  
  script.onload = loaded;
  
  script.src = 'http://api.openweathermap.org/data/2.5/forecast?q=Shanghai,cn&lang=zh_cn&callback=render';
  
  this.render = render;
  body.appendChild(script);
  
  // render data
  function render(data) {
    data = compose(data);
    fish.innerHTML = fish.innerHTML + template(data);
    chart(data.chart);
  }
  
  // remove the loading icon
  function loaded() {
    var loading = $('#loading', fish);
    loading && loading.classList.remove('active');
  }
}();


// jQuery-Like $
function $(selector, parent) {
  parent = parent || document;
  if(/^\#\w+$/.test(selector)) return parent.querySelector(selector);
  return [].slice.call(parent.querySelectorAll(selector));
}

// refomat data
function compose(data) {
  var _current = data.list[3];
  var _today =  today(Date.now());
  
  // today
  var current = {
    city: data.city.name + ',' + data.city.country,
    weather: _current.weather[0].description,
    temp: f2c(_current.main.temp),
    date:  _today[1] + '.' + _today[2] + ' ' + _today[0],
    icon: icon(_current.weather[0].icon)
  }
  
  
  var week = (function(list){
    var arr = []
    var obj = {};
    
    list.forEach(function(current){      
      var t = today(current.dt * 1000);
      var id = t[2];

      if(!obj[id]) return obj[id] = {
        min: f2c(current.main.temp_min), 
        max: f2c(current.main.temp_max),
        iconUp: icon(current.weather[0].icon),
        iconDown: icon(current.weather[0].icon),
        week: day(t[3]),
        date: t[1] + '/' + t[2] 
      }; 
      
      obj[id].min = Math.min(f2c(current.main.temp_min), obj[id].min);
      obj[id].max = Math.max(f2c(current.main.temp_max), obj[id].max);
      obj[id].iconDown = icon(current.weather[0].icon);
    });
    
    Object.keys(obj).sort(function(a, b) {
      return a - b;
    }).forEach(function(id) {
      arr.push(obj[id]);
    });
    
    return arr;
  })(data.list);
  
  var chart = {
    max: [],
    min: [],
    labels: ['']
  };
  
  week.forEach(function(item) {
    chart.max.push(item.max);
    chart.min.push(item.min);
    chart.labels.push(item.week);
  });
  
  chart.min.push(chart.min[0]);
  chart.max.push(chart.max[0]);
  chart.min.unshift(chart.min[0]);
  chart.max.unshift(chart.max[0]);
  chart.labels.push('');
  
  return {
    current: current,
    week: week,
    chart: chart
  };
}

// embed chart
function chart(data) {
  
  data = {
    labels: data.labels,
    datasets: [
      {
        label: 'Max',
        fillColor: "transparent",
        strokeColor: "#d35400",
        pointColor: "#e67e22",
        pointStrokeColor: "#d35400",
        pointHighlightFill: "#0088cc",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: data.max
      },
      {
        label: 'Min',
        fillColor: "transparent",
        strokeColor: "rgba(160,220,220,1)",
        pointColor: "rgba(160,220,220,1)",
        pointStrokeColor: "#ffffff",
        pointHighlightFill: "#ffffff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: data.min
      }
    ]
  };
  
  var options = {
    showScale: false,
    scaleShowLabels: false,
    tooltipFontFamily: 'Lato',
    scaleFontFamily: 'Lato',
    scaleShowGridLines: false,
    showYAxisLabel: false,
    responsive: true,
    tooltipTemplate: "<%= value %>",
    showTooltips: false
//    onAnimationComplete: function () {
//      this.showTooltip(this.datasets[0].points, true);
//    },
//    tooltipEvents: []
  };

  var temperature = $('#chart');
  var ctx = temperature.getContext('2d');
  ctx.canvas.height = 100;
  var chart = (new Chart(ctx)).Line(data, options);
  chart.showTooltip(chart.datasets[0].points);
}

// to C
function f2c(temp) {
  return parseInt(temp - 273.15);
}

// parse day: [yyyy, mm, dd]
function today(str) {
  var d = new Date(str);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getDay()]
}
  
// render tmpl
function template(data) {
  return Mustache.render($('#template').innerHTML, data);
}

