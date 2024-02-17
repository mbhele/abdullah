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
        const cardWrapper = document.createElement('div');
        cardWrapper.classList.add('card-wrapper');
    
        const card = document.createElement('div');
        card.classList.add('car-card');
        card.style.width = '100%'; // Adjust the width as needed
        card.style.boxSizing = 'border-box'; // Include padding and border in the width
        card.style.borderRadius = '8px'; // Set border-radius for rounded corners
        card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'; // Add box shadow for a subtle effect
        card.style.transition = 'transform 0.3s'; // Add transition effect on hover
        card.style.backgroundColor = '#ffff00'; // Set background color
        card.style.overflow = 'hidden'; // Hide overflow content
    
        const carImage = document.createElement('div');
        carImage.className = 'card-image';
    
        const imageElement = document.createElement('img');
        imageElement.src = car.image[0].url; // Assuming the first image URL is the main image
        imageElement.alt = `${car.make} ${car.model}`;
        imageElement.style.width = '100%'; // Use 100% width to fill the card width
        imageElement.style.height = '100%'; // Use 100% height to fill the card height
        imageElement.style.objectFit = 'cover'; // Maintain aspect ratio and cover the entire container
    
        carImage.appendChild(imageElement);
    
        const carDetails = document.createElement('div');
        carDetails.className = 'card-details';
        carDetails.style.display = 'flex';
        carDetails.style.flexDirection = 'column';
        carDetails.style.alignItems = 'center';
        carDetails.style.justifyContent = 'center';
        carDetails.style.height = '100%';
        carDetails.style.padding = '10px';
    
        const makeModel = document.createElement('h2');
        makeModel.textContent = `${car.make} ${car.model}`;
    
        const price = document.createElement('p');
        price.textContent = `Price: ${car.price}`;
    
        const viewMoreButton = document.createElement('button');
        viewMoreButton.textContent = 'View More';
        viewMoreButton.className = 'view-button';
        viewMoreButton.addEventListener('click', () => handleViewMore(car._id));
    
        carDetails.appendChild(makeModel);
        carDetails.appendChild(price);
        carDetails.appendChild(viewMoreButton);
    
        card.appendChild(carImage);
        card.appendChild(carDetails);
    
        cardWrapper.appendChild(card);
    
        return cardWrapper;
    }
    
    
    
    
    // Example of a custom function to handle "View More" button click
    function handleViewMore(carId) {
        // Navigate to the URL using the car ID
        window.location.href = `http://localhost:3001/cars/${carId}`;
    }
    function populateDropdownOptions(cars) {
        const makesDropdown = document.getElementById('filterMakes');
        const modelsDropdown = document.getElementById('filterModels');
        // const pricesDropdown = document.getElementById('filterPrice');

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
        // populateDropdownOptionsHelper(pricesDropdown, uniquePriceRanges);
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

                    return makeMatch && modelMatch;
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


document.body.style.overflowX = "hidden";
