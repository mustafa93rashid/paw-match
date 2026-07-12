### Actors

* Super Admin
* Shelter Employee
* Vet
* Adopter

----------------------------------------------------------

## Features

## User Management

* User registration and authentication.
* Role-based access control (Super Admin, Shelter Employee, Vet, Adopter).
* User profile management.
* Adopter profile management.
* Shelter employee profile management.
* Vet profile management.
* Activate and deactivate users.
* Password reset and account security.

## Animal Management

* Add new animals.
* Update animal information.
* View animal details.
* Upload multiple animal images.
* Manage adoption status.
* Activate and deactivate animals.
* Filter animals by species, breed, age, size, gender, and health status.

## Shelter Management

* Create shelters.
* Update shelter information.
* Verify shelters.
* Activate and deactivate shelters.
* Assign shelter employees.
* Remove shelter employees.
* Assign vets.
* Remove vets.
* View shelter animals.

## Adoption Request

* Submit adoption requests.
* Review adoption requests.
* Update request status.
* Track adoption progress.
* Approve or reject requests.
* View adoption history.

## Search by Location

* Search nearby shelters.
* Display shelter location.
* Filter shelters by city.
* View available animals by shelter.

## Appointment Management

* Book appointments.
* View appointment details.
* Confirm appointments.
* Cancel appointments.
* Complete consultations.
* Add consultation notes.
* View appointment history.

## Reviews (Bonus Feature)

* Rate shelters.
* Write reviews.
* View shelter ratings.
* View user reviews.
* Calculate average ratings.

----------------------------------------------------------

## Collection

# User {

firstName: String,

lastName: String,

dateOfBirth: Date,

gender: {
type: String,
enum: ["male", "female"]
},

email: {
type: String,
unique: true
},

password: String,

phone: String,

role: {
type: String,
enum: ["superadmin", "shelterEmployee", "vet", "adopter"],
default: "adopter"
},

profileImage: String,

address: String,

isActive: {
type: Boolean,
default: true
},

createdAt: Date,

updatedAt: Date

}

# AdopterProfile {

userId: ObjectId, // ref: User

homeType: {
type: String,
enum: ["apartment", "house", "farm"]
},

hasKids: Boolean,

hasOtherPets: Boolean,

experienceLevel: {
type: String,
enum: ["beginner", "intermediate", "expert"]
},

dailyActivityLevel: {
type: String,
enum: ["low", "medium", "high"]
},

isAllergic: Boolean,

ownerType: {
type: String,
enum: ["single", "family"]
},

preferredSpecies: {
type: String,
enum: ["dog", "cat", "bird", "rabbit", "fish", "any"]
},

createdAt: Date,

updatedAt: Date

}

# ShelterEmployeeProfile {

userId: ObjectId, // ref: User

shelterId: ObjectId, // ref: Shelter

position: String,

employeeNumber: String,

hireDate: Date,

isActive: {
type: Boolean,
default: true
},

createdAt: Date,

updatedAt: Date

}

# VetProfile {

userId: ObjectId, // ref: User

shelterId: ObjectId, // ref: Shelter

specialization: String,

bio: String,

experienceYears: Number,

availableDays: [String],

consultationTypes: {
type: [String],
enum: ["vetConsultation", "behaviorTraining"]
},

licenseNumber: String,

isActive: {
type: Boolean,
default: true
},

createdAt: Date,

updatedAt: Date

}

# Animal {

name: String,

age: Number,

ageUnit: {
type: String,
enum: ["months", "years"]
},

species: {
type: String,
enum: ["dog", "cat", "bird", "rabbit", "fish", "other"]
},

breed: String,

gender: {
type: String,
enum: ["male", "female"]
},

size: {
type: String,
enum: ["small", "medium", "large"]
},

color: String,

healthStatus: {
type: String,
enum: ["healthy", "needsCare", "specialNeeds", "underTreatment"]
},

vaccinated: Boolean,

description: String,

images: [String],

adoptionStatus: {
type: String,
enum: ["available", "pending", "adopted", "unavailable"],
default: "available"
},

shelterId: ObjectId, // ref: Shelter

addedBy: ObjectId, // ref: User

requirements: {

homeType: {
type: String,
enum: ["apartment", "house", "farm", "any"]
},

suitableForKids: Boolean,

goodWithOtherPets: {
type: Boolean,
default: false
},

experienceLevel: {
type: String,
enum: ["beginner", "intermediate", "expert", "any"]
},

dailyActivityLevel: {
type: String,
enum: ["low", "medium", "high"]
},

ownerType: {
type: String,
enum: ["single", "family", "any"]
},

suitableForAllergicPeople: Boolean

},

isActive: {
type: Boolean,
default: true
},

createdAt: Date,

updatedAt: Date

}

Shelter {

name: String,

description: String,

phone: String,

email: String,

address: String,

city: String,

location: {

type: {
type: String,
enum: ["Point"],
default: "Point"
},

coordinates: [Number]
// [longitude, latitude]

},

images: [String],

createdBy: ObjectId, // ref: User — Superadmin

isActive: {
type: Boolean,
default: true
},

createdAt: Date,

updatedAt: Date

}

# AdoptionRequest {

adopterId: {
type: ObjectId,
ref: "User"
},

animalId: {
type: ObjectId,
ref: "Animal"
},

shelterId: {
type: ObjectId,
ref: "Shelter"
},

status: {
  type: String,
  enum: [
    "pending",
    "interview",
    "homeCheck",
    "approved",
    "rejected"
  ]
}

InterviewDate: Date

InterviewNotes: String

notes: String,

rejectionReason: String,

ReviewedBy: {
type: ObjectId,
ref: "User"
},

createdAt: Date,
updatedAt: Date
}

# AppointmentManagment {

adopterId: {
type: ObjectId,
ref: "User"
},

vetId: {
type: ObjectId,
ref: "User"
},

animalId: {
type: ObjectId,
ref: "Animal"
},

appointmentType: {
type: String,
enum: ["vetConsultation", "behaviorTraining"]
},

<!-- startTime: {   with Moaness
type: Date,
required: true
},

endTime: {    with Moaness
type: Date,
required: true
}, -->

appointmentDate: Date,

status: {
type: String,
enum: [
"pending",
"confirmed",
"completed",
"cancelled"
],
},

notes: String,

createdAt: Date,
updatedAt: Date
}

# Review {
  userId: {
    type: ObjectId,
    ref: "User"
  },

  shelterId: {
    type: ObjectId,
    ref: "Shelter"
  },

  adoptionRequestId: {
    type: ObjectId,
    ref: "AdoptionRequest",
    unique: true
  },

  rating: {
    type: Number,
    min: 1,
    max: 5
  },

  comment: String,

  createdAt: Date,
  updatedAt: Date
}

# Relationships
- User (1) ----------------> (1) AdopterProfile
- User (1) ----------------> (1) ShelterEmployeeProfile
- User (1) ----------------> (1) VetProfile
- Shelter (1) ------------> (M) ShelterEmployeeProfile
- Shelter (1) ------------> (M) VetProfile
- Shelter (1) ------------> (M) Animal
- User (Shelter Employee) (1) ------------> (M) Animal
- User (Vet) (1) -------------------------> (M) Animal
- User (Superadmin) (1) -----------------> (M) Shelter

- Animal (1) -------------> (M) AdoptionRequest
- Shelter (1) ------------> (M) AdoptionRequest
- User (1) ---------------> (M) AdoptionRequest
- User (Adopter) (1) -----> (M) Appointment
- User (Vet) (1) ---------> (M) Appointment
- Animal (1) -------------> (M) Appointment
- User (1) -----------------> (M) Review
- Shelter (1) --------------> (M) Review
- AdoptionRequest (1) ------> (1) Review

# ALL RELATIONSHIPS (1:1 & 1:M) THERE IS NO (M:M)

----------------------------------------------------------

## RULES

## 1. Super Admin

* Manage all users.
* Manage all shelters.
* Approve or verify shelters.
* View and manage all animals.
* View all adoption requests.
* View all appointments.
* Activate or deactivate users, shelters, and animals.
* Assign shelter employees and vets to shelters.
* Remove shelter employees and vets from shelters.

## 2. Shelter Employee

* Manage animals only within their assigned shelter.
* Add new animals to their shelter.
* Update animal information.
* Activate or deactivate animals within their shelter.
* View adoption requests related to animals in their shelter.
* Review adoption requests for their shelter.
* Update adoption request stages:

  * `pendingReview`
  * `interview`
  * `homeCheck`
  * `approved`
  * `rejected`
* Cannot manage animals or requests belonging to another shelter.

## 3. Vet

* Manage only their own appointments.
* View appointment details assigned to them.
* Confirm appointments.
* Cancel appointments.
* Mark appointments as completed.
* Add consultation notes.
* View relevant animal and adopter information for their appointments.
* Cannot manage another vet's appointments.

## 4. Adopter

* Register and log in.
* Update personal profile.
* Complete or update the adopter profile and matching questions.
* Search nearby shelters.
* View available animal details.
* Submit adoption requests.
* View and cancel their own adoption requests while cancellation is allowed.
* Book appointments.
* View or cancel their own appointments.
* View the status of their own adoption requests and appointments.
