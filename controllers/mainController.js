const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureAuthenticated } = require('../middleware'); // Adjust the path based on your actual structure
const academicLevels = ['primary', 'highschool', 'university'];
const User = require('../models/userModel');
const Car = require('../models/carModel');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });
const Blacklist = require('../models/Blacklist'); // Add this line
const CarFinance = require('../models/carFinanceModel');

const ObjectId = require('mongoose').Types.ObjectId;

// Authentication Routes
router.get('/register', (req, res) => {
    res.render('Authi/register');
});

const getCurrentUser = (req) => {
    if (req && req.isAuthenticated && typeof req.isAuthenticated === 'function') {
        return req.isAuthenticated() ? req.user : null;
    } else {
        return null;
    }
};

router.get('/test-current-user', (req, res) => {
    const currentUser = getCurrentUser(req);

    if (currentUser) {
        res.send(`Current User: ${currentUser.username}`);
    } else {
        res.send('No authenticated user.');
    }
});

router.post('/register', async (req, res, next) => {
    const { email, username, password, confirmPassword, role } = req.body;

    if (!email) {
        return res.render('Authi/register', { error: 'Email is required' });
    }

    if (password !== confirmPassword) {
        return res.render('Authi/register', { error: 'Passwords do not match' });
    }

    const user = new User({ email, username, role });
    user.role = role;

    const registeredUser = await User.register(user, password);

    req.login(registeredUser, (err) => {
        if (err) return next(err);
        console.log(registeredUser);
        res.redirect('/dashboard');
    });
});

router.get('/login', (req, res) => {
    res.render('Authi/login');
});

router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    const redirectUrl = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
});


router.get('/', async (req, res) => {
    try {
      const cars = await Car.find();
      res.render('home', { pageTitle: 'Home', cars });
    } catch (error) {
      console.error(error);
      res.render('error');
    }
  });
  





router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard', { pageTitle: 'Dashboard', user: req.user });
});

// Academic Levels Routes
academicLevels.forEach(level => {
    router.get(`/academiclevels/${level}`, ensureAuthenticated, (req, res) => {
        const pageTitle = `${level.charAt(0).toUpperCase() + level.slice(1)} Information`;
        const viewName = `academiclevels/${level}`;
        res.render(viewName, { pageTitle });
    });
});

// Tutor Routes
router.get('/cars', async (req, res) => {
    try {
        const cars = await Car.find();
        res.render('cars/index', { cars });
    } catch (error) {
        res.render('error');
    }
});

router.get('/cars/create', ensureAuthenticated, (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be signed in');
        return res.redirect('/login');
    }
    res.render('cars/create');
});

router.post('/cars/create', upload.array('carImage'), async (req, res) => {
    try {
        const carName = req.body.name;
        const carSubject = req.body.subject;
        const carMake = req.body.make; // Extract make from the request
        const carModel = req.body.model; // Extract model from the request
        const carPrice = req.body.price;
        const carImages = req.files.map(file => ({
            url: file.path,
            filename: file.filename
        }));
        const currentUser = getCurrentUser(req);

        if (!currentUser) {
            req.flash('error', 'Authentication required.');
            return res.redirect('/login');
        }

        const newCar = new Car({
            name: carName,
            subject: carSubject,
            make: carMake, // Assign make to the new car
            model: carModel, // Assign model to the new car
            price: carPrice,
            image: carImages,
            author: currentUser._id
        });

        await newCar.save();

        res.redirect('/cars');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An unexpected error occurred. Please try again later.');
        res.render('error');
    }
});


router.get('/cars/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id).populate('author');

        if (!car) { // Fix: Change 'tutor' to 'car'
            res.render('error');
            return;
        }

        console.log('Author:', car.author);
        res.render('cars/show', {
            name: car.name,
            subject: car.subject,
            message: 'Custom message goes here',
            car: car
        });
    } catch (error) {
        res.render('error');
    }
});


router.get('/cars/:id/edit', ensureAuthenticated, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        res.render('cars/edit', { car });
    } catch (error) {
        res.render('error');
    }
});

router.post('/cars/:id/edit', multer({ storage }).array('carImage'), async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        const carName = req.body.name;
        const carSubject = req.body.subject;
        const carImages = req.files.map(file => ({
            url: file.path,
            filename: file.filename
        }));

        console.log("MBUSO", carImages);

        console.log('Original Car:', car);

        if (carImages.length > 0) {
            car.image.push(...carImages);
        }

        car.name = carName;
        car.subject = carSubject;

        const updatedCar = await car.save();

        console.log('Updated Tutor:', updatedCar);

        res.redirect(`/cars/${updatedCar._id}`);
    } catch (error) {
        console.error(error);
        res.render('error');
    }
});

router.post('/cars/:id', async (req, res) => {
    try {
        const deletedCar = await Car.findByIdAndDelete(req.params.id);
        if (!deletedCar) {
            return res.status(404).send('Car not found');
        }

        res.redirect('/Cars');
    } catch (error) {
        console.error('Error in delete route:', error);
        res.render('error');
    }
});
// Add this route to handle blacklisted clients
router.get('/blacklisted', (req, res) => {
    res.render('blacklisted');
});

// Handle form submission
router.post('/blacklisted', async(req, res) => {
    try {
        const { lastName, firstName, idNumber, netSalary, cellNumber, email } = req.body;
    
        // Validate input fields (you can customize this based on your schema)
        if (!lastName || !firstName || !idNumber || !netSalary || !cellNumber || !email) {
          req.flash('error', 'All fields are required'); // Flash an error message
          return res.redirect('/');
        }
    
        // Add entry to the blacklist
        const newEntry = await Blacklist.create({
          lastName,
          firstName,
          idNumber,
          netSalary,
          cellNumber,
          email,
        });
    
        req.flash('success', 'Entry added to blacklist successfully');
        res.redirect('/');
      } catch (error) {
        console.error(error);
        req.flash('error', 'Failed to add entry to blacklist');
        res.redirect('/');
      }
});




// Update the route to handle blacklisted clients
// Update the route to handle blacklisted clients
// Add this route to display blacklisted entries
router.get('/viewtheblacklist', async (req, res) => {
    try {
      // Fetch all entries from the Blacklist model
      const blacklistEntries = await Blacklist.find();
  
      // Render the view with the fetched blacklist entries
      res.render('viewtheblacklist', { blacklistEntries });
    } catch (error) {
      console.error(error);
      req.flash('error', 'Failed to fetch blacklist entries');
      res.redirect('/');
    }
  });


  // Display the finance application form
router.get('/finance-application', (req, res) => {
    res.render('financeApplicationForm');
  });
  
  // Handle the form submission
  router.post('/finance-application', async (req, res) => {
    try {
      // Create a new car finance application
      const carFinance = new CarFinance(req.body);
      // Save the application to the database
      await carFinance.save();
      res.redirect('/thank-you'); // Redirect to a thank-you page or next step
    } catch (error) {
      console.error(error);
      res.render('error'); // Handle errors appropriately
    }
  });
  
// Modify your server route handling /api/cars
router.get('/api/cars', async (req, res) => {
    try {
        // Extract filter parameters from query string
        const make = req.query.make || 'all';
        const model = req.query.model || 'all';
        const price = req.query.price || 'all';

        // Create a query object based on the filters
        const query = {};
        if (make !== 'all') {
            query.make = make;
        }
        if (model !== 'all') {
            query.model = model;
        }
        if (price !== 'all') {
            // Parse the price range and add it to the query
            const [minPrice, maxPrice] = price.split('-');
            query.price = { $gte: minPrice, $lte: maxPrice };
        }

        // Fetch cars based on the filters
        const filteredCars = await Car.find(query);

        // Send the filtered cars as JSON
        res.json(filteredCars);
    } catch (error) {
        console.error('Error fetching filtered cars:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/aboutus', (req, res) => {
    res.render('aboutUs'); // assuming your view file is named aboutUs.ejs
});


router.get('/success', (req, res) => {

        res.render('success');
  
});


router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.render('Authi/logout');
    });
});

module.exports = router;
