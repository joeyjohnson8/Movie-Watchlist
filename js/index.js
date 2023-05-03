//Variables
const searchField = document.querySelector('.search input')
const searchButton = document.querySelector('form')
const movieResults = document.querySelector('.results')
const moreResults = document.getElementById('more-results')
let currentSearch = ''
let pageNumber = 1

//Initiating local storage
if(!localStorage.getItem('Watchlist')) {
    localStorage.setItem('Watchlist', JSON.stringify([])) 
}

//API Search
function omdbSearch(searchText, pageNumber) { 
    fetch(`https://www.omdbapi.com/?apikey=737bef78&s=${searchText}&page=${pageNumber}`)
    .then( response => response.json() )
    .then( data => {
        if(data.Search) {
            omdbTitleSearch(data) //If there are results, continue
        }else {
            if(moreResults.classList.contains('hidden')) { //if there are no results, show error message.
                movieResults.innerHTML = `
                    <section class="movie-not-found">
                        <h2>Unable to find ${currentSearch}</h2>
                        <p>Please try again.</p>
                    </section>
                `    
            } else {
                moreResults.innerText = 'There are no results remaining.'
                moreResults.disabled = true    
            }
        }
    })
    .catch(error => console.log(error))
}

function omdbTitleSearch(searchData) { // Generate data from movie list
    let searchResults
    let movieSearchTitles = []
    searchResults = searchData.Search 
    searchResults.forEach( function(movies) { 
        movieSearchTitles.push(movies.Title)
    })
    
    let groupOfMovies = []
    movieSearchTitles.forEach( movieData => { 
        fetch(`https://www.omdbapi.com/?apikey=737bef78&t=${movieData}`)
        .then( response => response.json() )
        .then( data => {
            groupOfMovies.push(data)
            buildResults(data)
        })
    })


    function buildResults(data) { //Build result data into HTML
        Object.assign(this, data)
        const {Ratings, Poster, Title, Runtime, Genre, Plot} = this;
        const imdbRating = Ratings.length > 0 ? Ratings[0].Value.slice(0,3) : 'N/A'; //Filter out errors when there's no ratings
        if(data.Response !== 'False') {
            movieResults.innerHTML += `
                <section class="movie">
                    <div class="poster">
                        <img src="${Poster}" alt="movie-poster">
                    </div>
                    <div class="movie-info">
                        <h2>${Title} <span class="rating-score">⭐️ ${imdbRating}</span></h2>
                        <div class="movie-details">
                            <p>${Runtime}</p>
                            <p>${Genre}</p>
                            <button class="watch-list-btn add-btn-light" data-title="${Title}">Watchlist</button>
                        </div>
                        <div class="plot">
                            <p class="expand-text">${Plot}</p>
                            <button class="read-more">Read More</button>
                        </div>    
                    </div>
                </section>
            `;
            //Read more option
            const expandText = document.querySelectorAll('.read-more')
            expandText.forEach( (plot) => {
                plot.addEventListener('click', (e) => {
                    let clicked = e.target.previousElementSibling;
                    if(clicked.classList.contains('expand-text')) {
                        clicked.classList.toggle('expand-text')
                        e.target.innerText = "Read Less"
                    }else if(!clicked.classList.contains('expand-text')) {
                        clicked.classList.toggle('expand-text')
                        e.target.innerText = "Read More"
                    }
                })
            })
        }

        //Add to watchlist from search
        const addToWatchList = document.querySelectorAll('.watch-list-btn'); 
        addToWatchList.forEach( (wlBtn) => {
            let currentStorage = localStorage.getItem('Watchlist'); 
            let storedMovies = JSON.parse(currentStorage); 
            let verifyMovie = storedMovies.indexOf(wlBtn.dataset.title); 
            if(verifyMovie > -1) { 
                wlBtn.classList.remove('add-btn-light');
                wlBtn.classList.add('remove-btn-light');    
            }

            wlBtn.addEventListener('click', (e) => { 
                let addMovie = e.target.dataset.title; 
                if(!localStorage.getItem('Watchlist')) { 
                    localStorage.setItem('Watchlist', JSON.stringify([addMovie])) 
                    e.target.classList.remove('add-btn-light');
                    e.target.classList.add('remove-btn-light');
                }else {
                    currentStorage = localStorage.getItem('Watchlist');
                    storedMovies = JSON.parse(currentStorage);
                    verifyMovie = storedMovies.indexOf(addMovie);
                    if(verifyMovie > -1) { 
                      storedMovies.splice(verifyMovie, 1)
                      localStorage.setItem('Watchlist', JSON.stringify(storedMovies))
                      e.target.classList.remove('remove-btn-light');
                      e.target.classList.add('add-btn-light');    
                    } else { 
                        storedMovies.push(addMovie)
                        localStorage.setItem('Watchlist', JSON.stringify(storedMovies))
                        e.target.classList.remove('add-btn-light');
                        e.target.classList.add('remove-btn-light');    
                    }
                }
            })
        })
        
        if(moreResults.classList.contains('hidden')) { 
            moreResults.classList.toggle('hidden')
        }
    }
}

//More results event listener
moreResults.addEventListener('click', () => {
        pageNumber++
        omdbSearch(currentSearch, pageNumber)
})

//Search Submission
searchButton.addEventListener('submit', (e) => {
    e.preventDefault()
    moreResults.classList.contains("hidden") ? null : moreResults.classList.add("hidden")//hide the More Results Btn when starting new searches
    moreResults.innerText = 'More Results' //Reset text for More Results Btn
    moreResults.disabled = false //Re-enable button if pervious search reached the end
    pageNumber = 1 //Page needs to be 1 for new searches
    movieSearchTitles = [] //Erase previous search queries titles
    currentSearch = searchField.value //Saved search text to use with "More Results Btn"
    omdbSearch(searchField.value, pageNumber) //Perform a search using the API 
    searchField.value = null //Clear search field
    movieResults.innerHTML = '' //Clear HTML from Previous Results
})