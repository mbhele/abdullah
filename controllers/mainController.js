const express = require('express');
const router = express.Router();
const passport = require('passport');
const nodemailer = require('nodemailer'); // Import nodemailer
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


const isAdmin = (req, res, next) => {
    const currentUser = getCurrentUser(req);
  
    if (currentUser && currentUser.role === 'admin') {
      // User is an admin, proceed to the next middleware or route handler
      next();
    } else {
      // User is not an admin, redirect to a designated page
      res.redirect('/not-authorized'); // You can customize the redirect URL
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

const transporter = nodemailer.createTransport({
    service:'gmail',
    host: 'smtp.gmail.com',
    port: 587, // Use the appropriate port
    secure: false, // Use false if you're not using SSL/TLS
    auth: {
      user: '1mbusombhele@gmail.com',
      pass: 'rxyb eclg vpdy bghh',
    },
  })
  

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
  
    try {
      const registeredUser = await User.register(user, password);
  
      // Send registration email notification
      const mailOptions = {
        from: '1mbusombhele@gmail.com', // replace with your Gmail email
        to: 'mbusiseni.mbhele@gmail.com', // replace with your desired recipient email (your email address)
        subject: 'New User Registration',
        text: `A new user has registered!\n\nUsername: ${username}\nEmail: ${email}\nRole: ${role}`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
  
      req.login(registeredUser, (err) => {
        if (err) return next(err);
        console.log(registeredUser);
        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error(error);
      req.flash('error', 'An unexpected error occurred. Please try again later.');
      res.render('error');
    }
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

router.get('/cars/create', ensureAuthenticated,(req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be signed in');
        return res.redirect('/login');
    }
    res.render('cars/create');
});

router.post('/cars/create', upload.array('carImage'),ensureAuthenticated, async (req, res) => {
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

router.post('/cars/:id/edit', multer({ storage }).array('carImage'), ensureAuthenticated, async (req, res) => {
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

router.post('/cars/:id', ensureAuthenticated, async (req, res) => {
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

        // Send email notification
        const mailOptions = {
            from: '1mbusombhele@gmail.com',
            to: 'mbusiseni.mbhele@gmail.com',
            subject: 'New Blacklist Entry',
            text: `A new entry has been added to the blacklist!\n\nName: ${firstName} ${lastName}\nID Number: ${idNumber}\nEmail: ${email}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
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


  // Display the finance information page
router.get('/finance', (req, res) => {
    res.render('finance'); // assuming your view file is named finance.ejs

});

router.post('/finance', upload.fields([
    { name: 'payslips', maxCount: 1 },
    { name: 'copy_of_id', maxCount: 1 },
    { name: 'proof_of_address', maxCount: 1 },
    { name: 'license', maxCount: 1 },
    { name: 'bank_statement', maxCount: 1 },
    { name: 'spouse_documents', maxCount: 1 }
]), async (req, res) => {
    try {
        // Access form data from req.body
        const formData = req.body;
        console.log('Form Data:', formData);

        // Access file uploads from req.files
        const files = req.files;
        console.log('Uploaded Files:', files);

        // Your logic to handle the form data and files goes here
        // You can save the data to your database or perform any additional processing

        // Create a formatted HTML email body
        const emailBody = `
            <h2>New Finance Application Form Submitted</h2>
            
            <h3>Form Data:</h3>
            <pre>${JSON.stringify(formData, null, 2)}</pre>

            <h3>Uploaded Files:</h3>
            <ul>
                ${Object.entries(files).map(([fieldName, fileArray]) => {
                    return `
                        <li>
                            <strong>${fieldName}:</strong>
                            ${fileArray.map(file => {
                                return `
                                    <div>
                                        <p>Original Name: ${file.originalname}</p>
                                        <p>Mimetype: ${file.mimetype}</p>
                                        <p>Size: ${file.size} bytes</p>
                                        <a href="${file.path}" target="_blank">View/Download PDF</a>
                                    </div>`;
                            }).join('')}
                        </li>`;
                }).join('')}
            </ul>

            <p>Thank you!</p>
        `;

        // Send email notification
        const mailOptions = {
            from: '1mbusombhele@gmail.com',
            to: 'acauto86@gmail.com',
            subject: 'New Finance Application',
            html: emailBody,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        // Respond to the client as needed
        res.send('Form submitted successfully!');   

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



  // Display the finance application form

  
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


router.post('/cars/:id/send-message', async (req, res) => {
    try {
        // Extract form data from request body
        const { name, email, mobile, area, message } = req.body;
        const carId = req.params.id; // Extract car ID from params

        // Validate input fields (customize based on your schema)
        if (!name || !email || !mobile || !area || !message) {
            req.flash('error', 'All fields are required'); // Flash an error message
            return res.redirect(`/cars/${carId}/show`); // Redirect to the car details page
        }

        // Fetch the car details to get the image URL
        const car = await Car.findById(carId);
        if (!car) {
            req.flash('error', 'Car not found'); // Flash an error message
            return res.redirect('/'); // Redirect to the home page or handle accordingly
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'acauto86@gmail.com',
                pass: 'pqgg lpgv ihqs ohfw' // replace with your Gmail password
            }
        });

        const imageUrl = car.image[0].url;
   const mailOptions = {
    from: 'acauto86@gmail.com',
    to: 'acauto86@gmail.com',
    subject: 'I am interested in this car',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #000; color: #fff; padding: 20px; border-radius: 8px; text-align: center;">
            <img src="images/company-logo.svg" alt="Company Logo" style="max-width: 100px; margin-bottom: 15px;">
            <h2 style="color: #25d366; margin-bottom: 10px;">Abdullah's Car Sales</h2>
            <h3 style="color: #25d366; margin-bottom: 20px;">I am interested in this car</h3>
            <p style="margin-bottom: 15px;">Name: ${name}</p>
            <p style="margin-bottom: 15px;">Email: ${email}</p>
            <p style="margin-bottom: 15px;">Mobile: 
                <a href="https://wa.me/${mobile}" style="color: #25d366; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; padding: 10px 15px; background-color: #fff; border-radius: 5px; margin-top: 5px;">
                    <img src="images/social.svg" alt="WhatsApp Icon" style="width: 20px; height: 20px; margin-right: 5px;">
                    Contact on WhatsApp
                </a>
            </p>
            <p style="margin-bottom: 15px;">Area: ${area}</p>
            <p style="margin-bottom: 15px;">Message: ${message}</p>
            <img src="${imageUrl}" alt="${car.name}'s Image" style="max-width: 100%; border-radius: 8px; margin-top: 20px;">
        </div>
    `
};

        
        
        
        
        
        
        

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                req.flash('error', 'Failed to send email notification');
            } else {
                console.log('Email sent:', info.response);
                req.flash('success', 'Message sent successfully');
                res.render('success'); // Render success.ejs upon successful email send

            }
        });
    } catch (error)

{
    console.error(error);
    req.flash('error', 'Failed to send message');
    res.redirect(`/cars/${carId}/show`); // Redirect to the car details page
}
}
);


router.get('/aboutus', (req, res) => {
    res.render('aboutUs'); // assuming your view file is named aboutUs.ejs
});


router.get('/success', (req, res) => {

        res.render('success');
  
});

router.get('/address', (req, res) => {
    // You can replace the example address with your actual address
    
    
    res.render('address');
});

router.get('/not-authorized', (req, res) => {
    res.send('not-authorized'); // You can customize the view/template for the not-authorized page
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
