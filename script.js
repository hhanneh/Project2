const omdbApiKey = 'a972812';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('searchForm');
    const input = document.getElementById('searchInput');
    const areaSelect = document.getElementById('areaSelect');
    const suggestions = document.getElementById('suggestions');

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const movieTitle = input.value.trim();
        const areaId = areaSelect ? areaSelect.value : '101';

        if(movieTitle) {
            fetchMovieFromOMDb(movieTitle);
            fetchFinnkinoEvents(movieTitle, areaId);
            suggestions.innerHTML = '';
        }
    });

    input.addEventListener('input', function () {
        const query = input.value.trim();
        if (query.length > 1) { 
            fetchSuggestions(query);
        } else {
            suggestions.innerHTML = '';
        }
    });

    fetchAreas();
});

function fetchSuggestions(query) {
    const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${omdbApiKey}`;
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const suggestions = document.getElementById('suggestions');
            suggestions.innerHTML = '';
            if (data.Response === "True") {
                data.Search.forEach(movie => {
                    const item = document.createElement('div');
                    item.classList.add('suggestion-item');
                    item.textContent = movie.Title;
                    item.addEventListener('click', () => {
                        document.getElementById('searchInput').value = movie.Title;
                        suggestions.innerHTML = '';
                    });
                    suggestions.appendChild(item);
                });
            }
        })
        .catch(console.error);
}

function fetchMovieFromOMDb(title) {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${omdbApiKey}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.Response === "True") {
                displayMovieInfo(data);
            } else {
                alert("Not found")
            }
        })
        .catch(error => {
            console.error(error);
            alert("An error occurred: " + error);
        });
}

function displayMovieInfo(movie) {
    const movieInfo = `
      <div class="movie-card omdb-card">
        <h2>${movie.Title} (${movie.Year})</h2>
        <img src="${movie.Poster}" alt="${movie.Title} poster" />
        <p><strong>Genre:</strong> ${movie.Genre}</p>
        <p><strong>Director:</strong> ${movie.Director}</p>
        <p><strong>Plot:</strong> ${movie.Plot}</p>
      </div>
    `;

    const container = document.getElementById('movieContainer');
    container.innerHTML = movieInfo;
  }

  function fetchAreas() {
    const url = `https://www.finnkino.fi/xml/TheatreAreas/`;
    fetch(url)
        .then(response => response.text())
        .then(str => (new DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            const areas = data.querySelectorAll("TheatreArea");
            const areaSelect = document.getElementById('areaSelect');
            areas.forEach(area => {
                const id = area.querySelector('ID').textContent;
                const name = area.querySelector('Name').textContent;
                const option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                areaSelect.appendChild(option);
            });
        })
        .catch(console.error);
}

function fetchFinnkinoEvents(searchTitle, areaId) {
    const url = `https://www.finnkino.fi/xml/Events/`;

    fetch(url)
        .then(response => response.text())
        .then(str => (new DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            const events = data.querySelectorAll("Event");
            let foundEvent = null;

            console.log('Fetched events:', events);

            events.forEach(event => {
                const title = event.querySelector("Title").textContent;
                if (title.toLowerCase().includes(searchTitle.toLowerCase())) {
                    foundEvent = event.querySelector("ID").textContent;
                }
            });

            if (foundEvent) {
                fetchFinnkinoSchedule(foundEvent, areaId, searchTitle);
            } else {
                displayNoShowsFound();
            }
        })
        .catch(console.error);
}

function fetchFinnkinoSchedule(foundEvent, areaId = '101', searchTitle) {
    const url = `https://www.finnkino.fi/xml/Schedule/?area=${areaId}`;

    fetch(url)
        .then(response => response.text())
        .then(str => (new DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            const shows = data.querySelectorAll("Show");
            const container = document.getElementById('movieContainer');
            let found = false;

            container.innerHTML += `
              <div class="shows-header">
                <h3>Shows</h3>
              </div>
            `;

            console.log('Fetched shows:', shows);

            shows.forEach(show => {
                const title = show.querySelector("Title").textContent;
                
                if (title.toLowerCase().includes(searchTitle.toLowerCase())) {
                    const time = show.querySelector("dttmShowStart").textContent;
                    const poster = show.querySelector("EventLargeImagePortrait").textContent;

                    const showInfo = `
                      <div class="movie-card finnkino-card">
                        <h2>${title}</h2>
                        <p><strong>Showtime:</strong> ${time}</p>
                        <img src="${poster}" alt="${title} poster" />
                      </div>
                    `;
                    container.innerHTML += showInfo;
                    found = true;
                }
            });

            if (!found) {
                container.innerHTML += `
                  <div class="movie-card finnkino-card">
                    <p><strong>No shows at the moment.</strong></p>
                  </div>
                `;
            }
        })
        .catch(console.error);
}
                

function displayNoShowsFound() {
    const container = document.getElementById('movieContainer');
    container.innerHTML += `
      <div class="movie-card finnkino-card">
        <p><strong> No shows </strong></p>
      </div>
    `;
}