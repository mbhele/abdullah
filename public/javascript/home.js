document.addEventListener('DOMContentLoaded', function () {
    function isPriceInRange(price, range) {
        const [min, max] = range.split('-').map(Number);
        return price >= min && price <= max;
    }

    function updateImageGallery(filteredCars) {
        const imageGallery = document.getElementById('imageGallery');
        imageGallery.innerHTML = ''; // Clear previous results

        filteredCars.forEach(car => {
            const carCard = generateCarCard(car);
            imageGallery.appendChild(carCard);
        });
    }

    function generateCarCard(car) {
        const card = document.createElement('div');
        card.classList.add('car-card');
    
        const carImage = document.createElement('div');
        carImage.className = 'card-image';
        const imageElement = document.createElement('img');
        imageElement.src = car.image[0].url; // Assuming the first image URL is the main image
        imageElement.alt = `${car.make} ${car.model}`;
        carImage.appendChild(imageElement);
    
        const carDetails = document.createElement('div');
        carDetails.className = 'card-details';
    
        const makeModel = document.createElement('h2');
        makeModel.textContent = `${car.make} ${car.model}`;
    
        const price = document.createElement('p');
        price.textContent = `Price: ${car.price}`;
    
        // "View More" button
        const viewMoreButton = document.createElement('button');
        viewMoreButton.textContent = 'View More';
        viewMoreButton.addEventListener('click', () => handleViewMore(car._id)); // Pass the car ID to the function
    
        carDetails.appendChild(makeModel);
        carDetails.appendChild(price);
        carDetails.appendChild(viewMoreButton);
    
        card.appendChild(carImage);
        card.appendChild(carDetails);
    
        return card;
    }
    
    // Example of a custom function to handle "View More" button click
    function handleViewMore(carId) {
        // Navigate to the URL using the car ID
        window.location.href = `http://localhost:3001/cars/${carId}`;
    }
    function populateDropdownOptions(cars) {
        const makesDropdown = document.getElementById('filterMakes');
        const modelsDropdown = document.getElementById('filterModels');
        const pricesDropdown = document.getElementById('filterPrice');

        // Extract unique makes, models, and price ranges from the car data
        const uniqueMakes = [...new Set(cars.map(car => car.make))];
        const uniqueModels = [...new Set(cars.map(car => car.model))];
        const uniquePriceRanges = [
            ...new Set(cars.map(car => car.price)),
            'Not specified', // You can customize this as needed
        ];

        // Populate makes dropdown
        populateDropdownOptionsHelper(makesDropdown, uniqueMakes);

        // Populate models dropdown
        populateDropdownOptionsHelper(modelsDropdown, uniqueModels);

        // Populate prices dropdown
        populateDropdownOptionsHelper(pricesDropdown, uniquePriceRanges);
    }

    function populateDropdownOptionsHelper(dropdown, options) {
        // Clear existing options
        dropdown.innerHTML = '';

        // Add default "All" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All';
        dropdown.appendChild(allOption);

        // Add options based on the provided array
        options.forEach(option => {
            const dropdownOption = document.createElement('option');
            dropdownOption.value = option;
            dropdownOption.textContent = option;
            dropdown.appendChild(dropdownOption);
        });
    }

    // Fetch car data from the server
    fetch('/api/cars')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch car data');
            }
            return response.json();
        })
        .then(cars => {
            // Initial rendering
            updateImageGallery(cars);

            // Populate dropdown options based on fetched data
            populateDropdownOptions(cars);
        })
        .catch(error => {
            console.error('Error fetching car data:', error);
        });

    function performSearch() {
        console.log('Performing search...');
        const selectedMake = document.getElementById('filterMakes').value;
        const selectedModel = document.getElementById('filterModels').value;
        const selectedPriceRange = document.getElementById('filterPrice').value;

        fetch('/api/cars')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch car data');
                }
                return response.json();
            })
            .then(cars => {
                const filteredCars = cars.filter(car => {
                    const makeMatch = selectedMake === 'all' || car.make.toLowerCase() === selectedMake.toLowerCase();
                    const modelMatch = selectedModel === 'all' || car.model.toLowerCase() === selectedModel.toLowerCase();
                    const priceMatch = selectedPriceRange === 'all' || isPriceInRange(car.price, selectedPriceRange);

                    return makeMatch && modelMatch && priceMatch;
                });

                // Update the image gallery with filtered cars
                updateImageGallery(filteredCars);
            })
            .catch(error => {
                console.error('Error fetching car data:', error);
            });
    }

    // Attach the event listener after defining the function
    document.getElementById('searchButton').addEventListener('click', performSearch);
});
