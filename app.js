var MOVIEDBAPI_URL = 'https://api.themoviedb.org/3';
var API_KEY = '33f92bf010f98be95b93866a815e0504';
var state = {
	items: []
};

var getSearchResultsFromAPI = function (searchItem, callback) {
	var settings = {
		url: MOVIEDBAPI_URL + '/search/multi',
		data: {
			api_key: API_KEY,
			query: searchItem
		},
		datatype: 'json',
		type: 'GET',
		success: callback
	};
	$.ajax(settings);
};

var getMoviesByActor = function (personId, callback) {
	var settings = {
		url: MOVIEDBAPI_URL + '/person/' + personId + '/combined_credits',
		data: {
			api_key: API_KEY
		},
		datatype: 'json',
		type: 'GET',
		success: callback
	};
	$.ajax(settings);
}

var addSearchResults = function (data) {
	if(data.total_results !== 0) {
		data.results.forEach( function (item) {
			if(item.media_type === 'person') {
				getMoviesByActor(item.id, addMoviesByActor);
			}
			else {
				state.items.push(item);
			}
		});
		renderSearchResults(state);
	}
	else {
		$('.js-search-results').html('<p>No results available for the given search.</p>');
	}
	
};

var addMoviesByActor = function (data) {
	data.cast.forEach(function(pItem) {
		state.items.push(pItem);
	});
};


var getTitle = function (item) {
	if(item.title) {
		return item.title;
	}
	else {
		return item.name;
	}
};

var getThumbnailSrc = function (item) {
	if(item.poster_path !== null) {
		return 'https://image.tmdb.org/t/p/w185_and_h278_bestv2/' + item.poster_path ;
	}
	else {
		return 'images/defaultpic.png';
	}
};


var findItembyId = function (state, id) {
	for( var i = 0; i < state.items.length; i++ ) {
		if( state.items[i].id == id ) {
			
			return state.items[i];
		}
	}
};

var renderSearchResults = function (state) {
	var results = ''
	state.items.forEach(function(item) {
		results += '<div class="js-result-item" id="' + item.id +'" >' +
				'<img src="' + getThumbnailSrc(item) + '">' +
				'<h2>' + getTitle(item) + ' (' + item.media_type + ')</h2></div>';
	});
	$('.js-search-results').html(results);
};

var submitSearchForm = function (event) {
	event.preventDefault();
	var query = $(this).find('.js-search-input').val();
	getSearchResultsFromAPI(query, addSearchResults);
};

var getItemInfo = function (event) {
	$('.js-search').addClass('hidden');
	$('.js-movie-info').removeClass('hidden');
	var currentId = $(event.target).closest('.js-result-item').attr('id');
	var currentItem = findItembyId(state, currentId);
	

};

$('.js-search-form').submit(submitSearchForm);

$('.js-search-results').on('click', '.js-result-item', getItemInfo);