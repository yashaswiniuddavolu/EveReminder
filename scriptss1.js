// Global variables
let currentUser = null;
let allUsers = JSON.parse(localStorage.getItem('users')) || [];
let events = JSON.parse(localStorage.getItem('events')) || [];
let registrations = JSON.parse(localStorage.getItem('registrations')) || [];
let feedbacks = JSON.parse(localStorage.getItem('feedbacks')) || [];
let currentPin = null;

// Avatar images
const maleAvatar = 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png';
const femaleAvatar = 'https://cdn-icons-png.flaticon.com/512/3237/3237475.png';
const otherAvatar = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
const adminAvatar = 'https://cdn-icons-png.flaticon.com/512/2206/2206368.png';
const organizerAvatar = 'https://cdn-icons-png.flaticon.com/512/3281/3281289.png';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Always show college verification first
    document.getElementById('college-verification').style.display = 'flex';
    document.getElementById('signup-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';

    // Initialize event listeners
    initEventListeners();
});

// Initialize all event listeners
function initEventListeners() {
    // College verification form
    document.getElementById('collegeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const collegeName = document.getElementById('collegeName').value.trim();
        
        if (collegeName.toLowerCase().includes('sharda') || 
            collegeName.toLowerCase().includes('sharda university')) {
            document.getElementById('college-verification').style.display = 'none';
            showSignup();
        } else {
            alert('We are currently only serving Sharda University. We are working on expanding to other colleges.');
        }
    });

    // Signup form
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        signupUser();
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser();
    });

    // Event registration form
    document.getElementById('eventRegistrationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        registerForEvent();
    });

    // Admin create event form
    document.getElementById('adminCreateEventForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createEvent();
    });

    // Admin budget form
    document.getElementById('adminBudgetForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitBudget();
    });

    // Feedback form
    document.getElementById('feedbackForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitFeedback();
    });

    // Feedback type change
    document.getElementById('feedbackType').addEventListener('change', function() {
        const eventSelect = document.getElementById('feedbackEventSelect');
        const eventLabel = document.getElementById('feedbackEventLabel');
        
        if (this.value === 'event') {
            eventSelect.style.display = 'block';
            eventLabel.style.display = 'block';
            loadEventsForFeedback();
        } else {
            eventSelect.style.display = 'none';
            eventLabel.style.display = 'none';
        }
    });

    // Admin filter events
    document.getElementById('adminFilterEvent').addEventListener('change', function() {
        loadRegistrationsForAdmin();
    });

    // Feedback filter
    document.getElementById('feedbackFilterType').addEventListener('change', function() {
        loadFeedbacks();
    });

    // Photo preview
    if (document.getElementById('studentPhoto')) {
        document.getElementById('studentPhoto').addEventListener('change', function(e) {
            const photoPreview = document.getElementById('photoPreview');
            photoPreview.innerHTML = '';
            
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    photoPreview.appendChild(img);
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Event image preview
    if (document.getElementById('eventImage')) {
        document.getElementById('eventImage').addEventListener('change', function(e) {
            const imagePreview = document.getElementById('eventImagePreview');
            imagePreview.innerHTML = '';
            
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    imagePreview.appendChild(img);
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Event selection to autofill date and price
    if (document.getElementById('eventSelect')) {
        document.getElementById('eventSelect').addEventListener('change', function() {
            const selectedEvent = events.find(event => event.name === this.value);
            if (selectedEvent) {
                document.getElementById('eventDate').value = selectedEvent.date;
                document.getElementById('eventPrice').value = `₹${selectedEvent.price || '500'}`;
                generateQRCode(selectedEvent.price || 500);
            }
        });
    }

    // Payment method buttons
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (this.dataset.method === 'qr') {
                document.getElementById('qrPaymentSection').style.display = 'block';
                document.getElementById('razorpayPaymentSection').style.display = 'none';
            } else {
                document.getElementById('qrPaymentSection').style.display = 'none';
                document.getElementById('razorpayPaymentSection').style.display = 'block';
            }
        });
    });

    // Verify PIN button
    if (document.getElementById('verifyPinBtn')) {
        document.getElementById('verifyPinBtn').addEventListener('click', verifyPaymentPin);
    }
}

// Generate QR code for payment
function generateQRCode(amount) {
    currentPin = Math.floor(1000 + Math.random() * 9000); // Generate 4-digit PIN
    document.getElementById('displayPin').textContent = currentPin;
    document.getElementById('paymentPinSection').style.display = 'block';
    
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    qrCodeContainer.innerHTML = '';
    
    const paymentData = JSON.stringify({
        amount: amount,
        event: document.getElementById('eventSelect').value,
        pin: currentPin,
        timestamp: new Date().toISOString()
    });
    
    QRCode.toCanvas(qrCodeContainer, paymentData, { width: 200 }, function(error) {
        if (error) console.error(error);
    });
}

// Verify payment PIN
function verifyPaymentPin() {
    const enteredPin = document.getElementById('paymentPin').value;
    if (enteredPin === currentPin.toString()) {
        alert('Payment verified successfully!');
        document.getElementById('paymentStatus').textContent = 'Payment verified!';
        document.getElementById('paymentStatus').className = 'payment-status payment-success';
        document.getElementById('paymentStatus').style.display = 'block';
        return true;
    } else {
        alert('Incorrect PIN. Please try again.');
        document.getElementById('paymentStatus').textContent = 'Incorrect PIN. Try again.';
        document.getElementById('paymentStatus').className = 'payment-status payment-failure';
        document.getElementById('paymentStatus').style.display = 'block';
        return false;
    }
}

// Show signup form
function showSignup() {
    document.getElementById('signup-section').style.display = 'flex';
    document.getElementById('login-section').style.display = 'none';
}

// Show login form
function showLogin() {
    document.getElementById('signup-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'flex';
}

// Signup a new user
function signupUser() {
    const firstName = document.getElementById('firstName').value.trim();
    const middleName = document.getElementById('middleName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const gender = document.getElementById('gender').value;
    const department = document.getElementById('department').value;
    const userType = document.getElementById('userType').value;

    // Check if email already exists
    if (allUsers.some(user => user.email === email)) {
        alert('This email is already registered. Please use a different email or login.');
        return;
    }

    // Determine avatar based on gender and user type
    let avatar = '';
    if (userType === 'admin') {
        avatar = adminAvatar;
    } else if (userType === 'organizer') {
        avatar = organizerAvatar;
    } else {
        switch(gender) {
            case 'male': avatar = maleAvatar; break;
            case 'female': avatar = femaleAvatar; break;
            default: avatar = otherAvatar;
        }
    }

    // Create user object
    const user = {
        id: Date.now().toString(),
        firstName,
        middleName,
        lastName,
        email,
        password, // Note: In a real app, you should hash the password
        gender,
        department,
        userType,
        avatar,
        createdAt: new Date().toISOString(),
        balance: 0 // Initialize balance for refunds
    };

    // Add to users array
    allUsers.push(user);
    localStorage.setItem('users', JSON.stringify(allUsers));

    // Export to Excel
    exportUsersToExcel();

    // Show success message and switch to login
    alert('Registration successful! Please login with your credentials.');
    showLogin();
}

// Export users data to Excel
function exportUsersToExcel() {
    const data = allUsers.map(user => ({
        'First Name': user.firstName,
        'Middle Name': user.middleName,
        'Last Name': user.lastName,
        'Email': user.email,
        'Gender': user.gender,
        'Department': user.department,
        'User Type': user.userType,
        'Created At': user.createdAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    
    // Generate a unique filename
    const filename = `users_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // Export to Excel file
    XLSX.writeFile(workbook, filename);
}

// Login user
function loginUser() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Find user
    const user = allUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Show main content
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
        // Update UI based on user type
        setupUserDashboard();
    } else {
        alert('Invalid email or password. Please try again.');
    }
}

// Setup dashboard based on user type
function setupUserDashboard() {
    // Set user avatar in header
    const userAvatar = document.getElementById('user-avatar');
    userAvatar.src = currentUser.avatar;
    
    // Set user avatar in profile card
    const profileAvatar = document.getElementById('profile-avatar');
    profileAvatar.src = currentUser.avatar;
    
    // Show welcome message
    document.getElementById('welcome-user').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('user-greeting-name').textContent = currentUser.firstName;
    document.getElementById('user-role').textContent = currentUser.userType.charAt(0).toUpperCase() + currentUser.userType.slice(1);
    
    // Set profile info
    document.getElementById('profile-role').textContent = currentUser.userType.charAt(0).toUpperCase() + currentUser.userType.slice(1);
    document.getElementById('profile-dept').textContent = getDepartmentName(currentUser.department);
    document.getElementById('profile-email').textContent = currentUser.email;
    
    // Hide all navigation links first
    document.querySelectorAll('nav ul li').forEach(li => {
        if (!li.textContent.includes('Dashboard') && !li.textContent.includes('Feedback') && !li.textContent.includes('Logout')) {
            li.style.display = 'none';
        }
    });
    
    // Show appropriate links based on user type
    if (currentUser.userType === 'student') {
        document.getElementById('student-registration-link').style.display = 'block';
        document.getElementById('registered-events-link').style.display = 'block';
        loadStudentDashboard();
    } else if (currentUser.userType === 'admin') {
        document.getElementById('admin-events-link').style.display = 'block';
        document.getElementById('admin-budget-link').style.display = 'block';
        document.getElementById('admin-registrations-link').style.display = 'block';
        document.getElementById('admin-feedback-view').style.display = 'block';
        loadAdminDashboard();
    } else if (currentUser.userType === 'organizer') {
        document.getElementById('organizer-events-link').style.display = 'block';
        document.getElementById('admin-registrations-link').style.display = 'block';
        document.getElementById('admin-feedback-view').style.display = 'block';
        loadOrganizerDashboard();
    }
    
    // Show dashboard by default
    showSection('dashboard');
}

// Get department full name
function getDepartmentName(code) {
    const departments = {
        'CSE': 'Computer Science Engineering',
        'MBBS': 'Medical Science',
        'DENTAL': 'Dental Science',
        'MECHANICAL': 'Mechanical Engineering',
        'ELECTRICAL': 'Electrical Engineering',
        'CIVIL': 'Civil Engineering',
        'BUSINESS': 'Business Administration',
        'LAW': 'Law',
        'PHARMACY': 'Pharmacy'
    };
    return departments[code] || code;
}


// Register for an event
function registerForEvent() {
    const selectedEvent = events.find(e => e.name === document.getElementById('eventSelect').value);
    if (!selectedEvent) {
        alert('Please select a valid event');
        return;
    }

    const photoFile = document.getElementById('studentPhoto').files[0];
    const studentName = document.getElementById('studentName').value.trim();
    const studentId = document.getElementById('studentId').value.trim();

    if (!photoFile) {
        alert('Please upload your photo');
        return;
    }

    if (!studentName || !studentId) {
        alert('Please fill in all required fields');
        return;
    }

    // Check payment method
    const isQRPayment = document.querySelector('.payment-method-btn[data-method="qr"]').classList.contains('active');
    
    if (isQRPayment) {
        // For QR payment, verify PIN first
        const pinVerified = verifyPaymentPin();
        if (!pinVerified) {
            return;
        }
        // If PIN verified, proceed with registration
        completeRegistration(selectedEvent, photoFile, studentName, studentId, true);
    } else {
        // For Razorpay payment, initiate payment first
        initiateRazorpayPayment(selectedEvent, photoFile, studentName, studentId);
    }
}

// Initiate Razorpay payment
function initiateRazorpayPayment(event, photoFile, studentName, studentId) {
    const amount = event.price || 500;
    const paymentStatus = document.getElementById('paymentStatus');
    paymentStatus.style.display = 'block';
    paymentStatus.textContent = 'Processing payment...';
    paymentStatus.className = 'payment-status';

    const options = {
        key: 'rzp_test_1DP5mmOlF5G5ag', // Test API key
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'College Event Management',
        description: `Payment for ${event.name}`,
        image: 'https://example.com/your_logo.png',
        handler: function(response) {
            paymentStatus.textContent = 'Payment successful!';
            paymentStatus.className = 'payment-status payment-success';
            completeRegistration(event, photoFile, studentName, studentId, false, response.razorpay_payment_id);
        },
        prefill: {
            name: studentName,
            email: currentUser.email,
            contact: '9999999999'
        },
        notes: {
            event: event.name,
            studentId: studentId
        },
        theme: {
            color: '#673ab7'
        }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function(response) {
        paymentStatus.textContent = 'Payment failed. Please try again.';
        paymentStatus.className = 'payment-status payment-failure';
        console.error(response.error);
    });
    rzp.open();
}

// Complete registration after payment
function completeRegistration(event, photoFile, studentName, studentId, isQRPayment, paymentId = null) {
    const paymentStatus = document.getElementById('paymentStatus');
    
    // Read the photo file
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoPreview = document.getElementById('photoPreview');
        const studentPhotoHTML = `<img src="${e.target.result}" alt="Student Photo">`;

        // Generate a random payment ID if not provided (for QR payments)
        const finalPaymentId = paymentId || 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // Create registration object
        const registration = {
            id: Date.now().toString(),
            studentId: currentUser.id,
            studentName: studentName,
            studentPhoto: studentPhotoHTML,
            eventName: event.name,
            eventDate: event.date,
            registrationDate: new Date().toISOString().split('T')[0],
            status: 'Registered',
            paymentId: finalPaymentId,
            paymentMethod: isQRPayment ? 'qr_code' : 'razorpay',
            paymentDetails: {
                type: isQRPayment ? 'qr_code' : 'razorpay',
                pin: isQRPayment ? currentPin : null
            },
            paymentStatus: 'Completed',
            amountPaid: event.price || 500
        };
        
        // Add to registrations
        registrations.push(registration);
        localStorage.setItem('registrations', JSON.stringify(registrations));
        
        // Export payment to Excel
        exportPaymentToExcel(registration);
        
        // Reset form
        document.getElementById('eventRegistrationForm').reset();
        document.getElementById('photoPreview').innerHTML = '';
        document.getElementById('qrCodeContainer').innerHTML = '';
        document.getElementById('paymentPinSection').style.display = 'none';
        
        // Update registered events list
        if (document.getElementById('student-registered-events').classList.contains('active')) {
            loadStudentRegistrations();
        }

        // Show success message
        alert('Registration successful!');
    };
    reader.readAsDataURL(photoFile);
}

// Export payment to Excel
function exportPaymentToExcel(registration) {
    const data = [{
        'Payment ID': registration.paymentId,
        'Student Name': registration.studentName,
        'Student ID': registration.studentId,
        'Event Name': registration.eventName,
        'Amount': registration.amountPaid,
        'Payment Method': registration.paymentMethod,
        'Payment Status': registration.paymentStatus,
        'Date': new Date().toISOString()
    }];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, `payment_${registration.paymentId}.xlsx`);
}

// Create a new event (admin/organizer)
function createEvent() {
    const eventName = document.getElementById('eventName').value.trim();
    const eventDate = document.getElementById('eventDateAdmin').value;
    const eventLocation = document.getElementById('eventLocation').value.trim();
    const eventDescription = document.getElementById('eventDescription').value.trim();
    const eventImage = document.getElementById('eventImage').files[0];
    
    if (!eventImage) {
        alert('Please select an event image');
        return;
    }
    
    // Read image as base64
    const reader = new FileReader();
    reader.onload = function(e) {
        // Create event object
        const event = {
            id: Date.now().toString(),
            name: eventName,
            date: eventDate,
            location: eventLocation,
            description: eventDescription,
            image: e.target.result,
            price: "500", // Default price
            budget: null,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString()
        };
        
        // Add to events
        events.push(event);
        localStorage.setItem('events', JSON.stringify(events));
        
        // Reset form and show success
        document.getElementById('adminCreateEventForm').reset();
        document.getElementById('eventImagePreview').innerHTML = '';
        alert('Event created successfully!');
        
        // Update dashboard immediately
        if (document.getElementById('dashboard').classList.contains('active')) {
            loadEventsForDashboard();
        }
        
        // Reload events in dropdowns
        loadEventsForRegistration();
        loadEventsForFeedback();
        loadEventsForAdminFilter();
    };
    reader.readAsDataURL(eventImage);
}

// Submit budget for an event
function submitBudget() {
    const eventName = document.getElementById('budgetEventSelect').value;
    const budgetAmount = document.getElementById('budgetAmount').value;
    const budgetDetails = document.getElementById('budgetDetails').value.trim();
    const eventPrice = document.getElementById('budgetEventPrice').value;
    
    // Update event with budget and price
    const eventIndex = events.findIndex(e => e.name === eventName);
    if (eventIndex !== -1) {
        events[eventIndex].budget = {
            amount: budgetAmount,
            details: budgetDetails,
            setBy: currentUser.id,
            setAt: new Date().toISOString()
        };
        events[eventIndex].price = eventPrice;
        localStorage.setItem('events', JSON.stringify(events));
    }
    
    alert(`Budget and price set for ${eventName}\nBudget: ₹${budgetAmount}\nPrice: ₹${eventPrice}`);
    document.getElementById('adminBudgetForm').reset();
}

// Submit feedback
function submitFeedback() {
    const feedbackType = document.getElementById('feedbackType').value;
    const feedbackText = document.getElementById('feedbackText').value.trim();
    let eventId = '';
    
    if (feedbackType === 'event') {
        const eventSelect = document.getElementById('feedbackEventSelect');
        eventId = eventSelect.options[eventSelect.selectedIndex].value;
    }
    
    // Create feedback object
    const feedback = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userType: currentUser.userType,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        type: feedbackType,
        eventId,
        text: feedbackText,
        createdAt: new Date().toISOString()
    };
    
    // Add to feedbacks
    feedbacks.push(feedback);
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    
    // Reset form and show success
    document.getElementById('feedbackForm').reset();
    alert('Thank you for your feedback!');
    
    // Reload feedback list if visible
    if (document.getElementById('admin-feedback-view').style.display === 'block') {
        loadFeedbacks();
    }
}

// Delete an event
function deleteEvent(eventId) {
    const eventToDelete = events.find(event => event.id === eventId);
    
    // Check if current user is organizer and event was created by admin
    if (currentUser.userType === 'organizer' && eventToDelete.createdBy !== currentUser.id) {
        alert('You cannot delete events created by admin.');
        return;
    }
    
    if (confirm('Are you sure you want to delete this event?')) {
        events = events.filter(event => event.id !== eventId);
        localStorage.setItem('events', JSON.stringify(events));
        loadEventsForDashboard();
    }
}

// Delete a registration (for admin/organizer)
function deleteRegistration(registrationId) {
    if (confirm('Are you sure you want to delete this registration?')) {
        registrations = registrations.filter(reg => reg.id !== registrationId);
        localStorage.setItem('registrations', JSON.stringify(registrations));
        loadRegistrationsForAdmin();
    }
}

// Cancel a registration (for student)
function cancelRegistration(registrationId) {
    if (confirm('Are you sure you want to cancel this registration? The amount will be refunded to your account.')) {
        const registration = registrations.find(reg => reg.id === registrationId);
        if (registration) {
            // Refund amount to student
            const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                allUsers[userIndex].balance = (allUsers[userIndex].balance || 0) + registration.amountPaid;
                localStorage.setItem('users', JSON.stringify(allUsers));
            }
            
            // Remove registration
            registrations = registrations.filter(reg => reg.id !== registrationId);
            localStorage.setItem('registrations', JSON.stringify(registrations));
            
            alert(`Registration cancelled. ₹${registration.amountPaid} has been credited to your account.`);
            loadStudentRegistrations();
        }
    }
}

// Load student dashboard
function loadStudentDashboard() {
    loadEventsForDashboard();
    loadEventsForRegistration();
    loadStudentRegistrations();
}

// Load admin dashboard
function loadAdminDashboard() {
    loadEventsForDashboard();
    loadEventsForAdmin();
    loadRegistrationsForAdmin();
    loadFeedbacks();
}

// Load organizer dashboard
function loadOrganizerDashboard() {
    loadEventsForDashboard();
    loadOrganizerEvents();
    loadRegistrationsForAdmin();
    loadFeedbacks();
}

// Load organizer events
function loadOrganizerEvents() {
    const today = new Date().toISOString().split('T')[0];
    const organizerEvents = events.filter(event => event.createdBy === currentUser.id);
    
    const container = document.querySelector('#organizer-event-management .events-grid');
    container.innerHTML = '';
    
    if (organizerEvents.length === 0) {
        container.innerHTML = '<p class="info-message">No events created by you yet.</p>';
    } else {
        organizerEvents.forEach(event => {
            container.innerHTML += `
                <div class="event-card">
                    <div class="event-image-container">
                        ${event.image ? `<img src="${event.image}" alt="${event.name}" class="event-image">` : ''}
                    </div>
                    <h3>${event.name}</h3>
                    <p>Date: ${formatDate(event.date)}</p>
                    <p>Location: ${event.location}</p>
                    <p class="event-description">${event.description}</p>
                    <button onclick="deleteEvent('${event.id}')" class="delete-event">Delete Event</button>
                </div>
            `;
        });
    }
}

// Load events for dashboard
function loadEventsForDashboard() {
    const today = new Date().toISOString().split('T')[0];
    
    // Filter upcoming and past events
    const upcoming = events.filter(event => event.date >= today);
    const past = events.filter(event => event.date < today);
    
    // Display upcoming events
    const upcomingContainer = document.querySelector('#upcoming-events .events-grid');
    upcomingContainer.innerHTML = '';
    
    if (upcoming.length === 0) {
        upcomingContainer.innerHTML = '<p class="info-message">No upcoming events scheduled.</p>';
    } else {
        upcoming.forEach(event => {
            let deleteButton = '';
            if ((currentUser.userType === 'admin') || 
                (currentUser.userType === 'organizer' && event.createdBy === currentUser.id)) {
                deleteButton = `<button onclick="deleteEvent('${event.id}')" class="delete-event">Delete</button>`;
            }
            
            let budgetInfo = '';
            if (event.budget) {
                budgetInfo = `
                    <div class="budget-card">
                        <h4>Budget Details</h4>
                        <p><strong>Amount:</strong> <span class="budget-amount">₹${event.budget.amount}</span></p>
                        <p><strong>Price:</strong> <span class="event-price">₹${event.price}</span></p>
                        <p>${event.budget.details}</p>
                    </div>
                `;
            }
            
            upcomingContainer.innerHTML += `
                <div class="event-card">
                    <div class="event-image-container">
                        ${event.image ? `<img src="${event.image}" alt="${event.name}" class="event-image">` : ''}
                    </div>
                    <h3>${event.name}</h3>
                    <p>Date: ${formatDate(event.date)}</p>
                    <p>Location: ${event.location}</p>
                    <p class="event-description">${event.description}</p>
                    ${budgetInfo}
                    ${deleteButton}
                </div>
            `;
        });
    }
    
    // Display past events
    const pastContainer = document.querySelector('#past-events .events-grid');
    pastContainer.innerHTML = '';
    
    if (past.length === 0) {
        pastContainer.innerHTML = '<p class="info-message">No past events found.</p>';
    } else {
        past.forEach(event => {
            pastContainer.innerHTML += `
                <div class="event-card">
                    <div class="event-image-container">
                        ${event.image ? `<img src="${event.image}" alt="${event.name}" class="event-image">` : ''}
                    </div>
                    <h3>${event.name}</h3>
                    <p>Date: ${formatDate(event.date)}</p>
                    <p>Location: ${event.location}</p>
                    <p class="event-description">${event.description}</p>
                </div>
            `;
        });
    }
}

// Load events for registration dropdown
function loadEventsForRegistration() {
    const today = new Date().toISOString().split('T')[0];
    const upcomingEvents = events.filter(event => event.date >= today);
    const eventSelect = document.getElementById('eventSelect');
    
    // Clear existing options except the first one
    while (eventSelect.options.length > 1) {
        eventSelect.remove(1);
    }
    
    // Add upcoming events
    upcomingEvents.forEach(event => {
        const option = document.createElement('option');
        option.value = event.name;
        option.textContent = `${event.name} (₹${event.price || '500'})`;
        eventSelect.appendChild(option);
    });

    // Add event listener to update date and price when event is selected
    eventSelect.addEventListener('change', function() {
        const selectedEvent = events.find(event => event.name === this.value);
        if (selectedEvent) {
            document.getElementById('eventDate').value = selectedEvent.date;
            document.getElementById('eventPrice').value = `₹${selectedEvent.price || '500'}`;
            generateQRCode(selectedEvent.price || 500);
        } else {
            document.getElementById('eventDate').value = '';
            document.getElementById('eventPrice').value = '';
            document.getElementById('qrCodeContainer').innerHTML = '';
        }
    });
}

// Load events for admin/organizer forms
function loadEventsForAdmin() {
    const eventSelect = document.getElementById('budgetEventSelect');
    
    // Clear existing options except the first one
    while (eventSelect.options.length > 1) {
        eventSelect.remove(1);
    }
    
    // Add all events
    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.name;
        option.textContent = `${event.name} (₹${event.price || 'Not set'})`;
        eventSelect.appendChild(option);
    });
}

// Load events for feedback dropdown
function loadEventsForFeedback() {
    const eventSelect = document.getElementById('feedbackEventSelect');
    
    // Clear existing options
    eventSelect.innerHTML = '';
    
    // Add all events
    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = event.name;
        eventSelect.appendChild(option);
    });
}

// Load events for admin filter dropdown
function loadEventsForAdminFilter() {
    const eventSelect = document.getElementById('adminFilterEvent');
    
    // Clear existing options except the first one
    while (eventSelect.options.length > 1) {
        eventSelect.remove(1);
    }
    
    // Add all events
    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.name;
        option.textContent = `${event.name} (₹${event.price || '500'})`;
        eventSelect.appendChild(option);
    });
}

// Load student's registered events
function loadStudentRegistrations() {
    const studentRegistrations = registrations.filter(reg => reg.studentId === currentUser.id);
    const container = document.getElementById('registered-events-list');
    const noRegistrations = document.getElementById('no-registrations');
    
    container.innerHTML = '';
    
    if (studentRegistrations.length === 0) {
        noRegistrations.style.display = 'block';
    } else {
        noRegistrations.style.display = 'none';
        studentRegistrations.forEach(reg => {
            container.innerHTML += `
                <div class="registered-event-item">
                    ${reg.studentPhoto}
                    <h4>${reg.eventName}</h4>
                    <p><strong>Date:</strong> ${formatDate(reg.eventDate)}</p>
                    <p><strong>Registered On:</strong> ${formatDate(reg.registrationDate)}</p>
                    <p><strong>Status:</strong> ${reg.status}</p>
                    <p><strong>Amount Paid:</strong> ₹${reg.amountPaid || '500'}</p>
                    <p><strong>Payment ID:</strong> ${reg.paymentId}</p>
                    <p><strong>Payment Status:</strong> <span class="${reg.paymentStatus === 'Completed' ? 'payment-success' : 'payment-failure'}">${reg.paymentStatus}</span></p>
                    <button onclick="cancelRegistration('${reg.id}')" class="delete-registration">Cancel Registration</button>
                </div>
            `;
        });
    }
}

// Load registrations for admin view
function loadRegistrationsForAdmin() {
    const filter = document.getElementById('adminFilterEvent').value;
    let filteredRegistrations = registrations;
    
    if (filter !== 'all') {
        filteredRegistrations = registrations.filter(reg => reg.eventName === filter);
    }
    
    const container = document.getElementById('admin-registrations-list');
    
    if (filteredRegistrations.length === 0) {
        container.innerHTML = '<p class="info-message">No registrations available.</p>';
    } else {
        container.innerHTML = '';
        filteredRegistrations.forEach(reg => {
            container.innerHTML += `
                <div class="registration-card">
                    ${reg.studentPhoto}
                    <h4>${reg.studentName}</h4>
                    <p><strong>Event:</strong> <span class="event-name">${reg.eventName}</span></p>
                    <p><strong>Event Date:</strong> ${formatDate(reg.eventDate)}</p>
                    <p><strong>Registered On:</strong> ${formatDate(reg.registrationDate)}</p>
                    <p><strong>Amount Paid:</strong> ₹${reg.amountPaid || '500'}</p>
                    <p><strong>Payment ID:</strong> ${reg.paymentId}</p>
                    <p><strong>Payment Status:</strong> <span class="${reg.paymentStatus === 'Completed' ? 'payment-success' : 'payment-failure'}">${reg.paymentStatus}</span></p>
                    <button onclick="deleteRegistration('${reg.id}')" class="delete-registration">Delete Registration</button>
                </div>
            `;
        });
    }
}

// Load feedbacks for admin/organizer view
function loadFeedbacks() {
    const filter = document.getElementById('feedbackFilterType').value;
    let filteredFeedbacks = feedbacks;
    
    if (filter !== 'all') {
        filteredFeedbacks = feedbacks.filter(fb => fb.type === filter);
    }
    
    const container = document.getElementById('feedback-list');
    
    if (filteredFeedbacks.length === 0) {
        container.innerHTML = '<p class="info-message">No feedback available.</p>';
    } else {
        container.innerHTML = '';
        filteredFeedbacks.forEach(fb => {
            let eventInfo = '';
            if (fb.type === 'event') {
                const event = events.find(e => e.id === fb.eventId);
                eventInfo = event ? `<p><strong>Event:</strong> ${event.name}</p>` : '';
            }
            
            container.innerHTML += `
                <div class="feedback-item">
                    <h4>${fb.userName} (${fb.userType})</h4>
                    <p><strong>Type:</strong> ${fb.type}</p>
                    ${eventInfo}
                    <p><strong>Feedback:</strong> ${fb.text}</p>
                    <p><small>Submitted on: ${formatDateTime(fb.createdAt)}</small></p>
                </div>
            `;
        });
    }
}

// Show section
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// Show events tab
function showEvents(eventId) {
    document.getElementById('upcoming-events').classList.remove('active');
    document.getElementById('past-events').classList.remove('active');
    document.querySelectorAll('.dashboard-tabs button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(eventId).classList.add('active');
    document.querySelector(`button[onclick="showEvents('${eventId}')"]`).classList.add('active');
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format date and time for display
function formatDateTime(dateTimeString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleDateString(undefined, options);
}

// Logout user
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('college-verification').style.display = 'flex';
    document.getElementById('signup-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
}

function truncateText() {
    const descriptions = document.querySelectorAll('.event-description');
    const lineHeight = 1.4; // Should match your CSS line-height
    const maxLines = 2;
    
    descriptions.forEach(desc => {
        const style = window.getComputedStyle(desc);
        const fontSize = parseFloat(style.fontSize);
        const maxHeight = fontSize * lineHeight * maxLines;
        
        if (desc.scrollHeight > maxHeight) {
            desc.style.overflow = 'hidden';
            desc.style.maxHeight = `${maxHeight}px`;
            desc.style.position = 'relative';
            
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.position = 'absolute';
            ellipsis.style.right = '0';
            ellipsis.style.bottom = '0';
            ellipsis.style.background = 'white';
            ellipsis.style.paddingLeft = '5px';
            
            desc.appendChild(ellipsis);
        }
    });
}

// Run on load and resize
window.addEventListener('load', truncateText);
window.addEventListener('resize', truncateText);