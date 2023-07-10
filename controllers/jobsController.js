
const Job = require('../models/jobs')
const geoCoder = require('../utils/geocoder')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const APIFilters = require('../utils/apiFilters')
const path = require("path")
const { errorMonitor } = require('events')




exports.getJobs = async (req, res, next) => {

    const apiFilters = new APIFilters(Job.find(),req.query)
    .filter()
    .sort()
    .limitFields()
    .searchByQuery();
    const jobs = await apiFilters.query;

    res.status(200).json({
        success : true,
        results : jobs.length,
        data : jobs
    });
}

// Get a single job with id and slug
exports.getJob = catchAsyncErrors( async (req, res, next) => {
    const job = await Job.find({$and: [{_id : req.params.id}, {slug : req.params.slug}]});

    if(!job || job.length === 0) {
        res.status(404).json({
            success : false,
            message : 'Job not found.'
        });
    }

    res.status(200).json({
        success : true,
        data : job
    })
})
// Create a new Job 
exports.newJob = catchAsyncErrors( async (req, res, next) => {
    // Adding  user to body
    req.body.user = req.user.id
    const job = await Job.create(req.body);
    res.status(200).json({
        success : true,
        message : 'Job Created',
        data : job
    })
})

// Update a Job
exports.updateJob = catchAsyncErrors( async (req, res, next) => {
    let job = Job.findById(req.params.id);

    if(!job) {
        return next(new ErrorHandler('Job not found', 404))
    }

    //Check if the user is owner
    if(job.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorHandler('User is not allowed to update this job'))
    }


    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
        new : true,
        runValidators : true,
        useFindAndModify : false
    })

    res.status(200).json({
        success : true,
        message : 'Job is updated',
        data : job
    })
})

// delete a Job
exports.deleteJob = catchAsyncErrors( async (req, res, next) => {
    let job = Job.findById(req.params.id).select('+applicantsApplied');

    if(job.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorHandler('User is not allowed to delete this job'))
    }

// Delete associated files

    const delJob = await Job.findOne({_id : req.params.id})
     for(let i = 0; i < delJob.applicantsApplied.length; i++){
        let filepath = `${__dirname}/public/uploads/${delJob.applicantsApplied[i].resume}`.replace('\\controllers', '');

        fs.unlink(filepath, err => {
            if(err) return console.log(err);
        })
     }
     
    if(!job) {
        res.status(404).json({
            success : false,
            message : 'Job not found.'
        });
    }

    job = await Job.findByIdAndRemove(req.params.id);
    res.status(200).json({
        success : true,
        message : 'Job is deleted.'
    })
})


// Search jobs with radius 
exports.getJobsInRadius = catchAsyncErrors( async (req, res, next) => {
    const {zipcode, distance} = req.params;
    //getting latitude & longitude from geocoder with zipcode
    const loc = await geoCoder.geocode(zipcode);
    const latitude = loc[0].latitude;
    const longitude = loc[0].longitude;

    const radius = distance / 3963;
    const jobs = await Job.find({
        location: {$geoWithin : {$centerSphere : [[longitude, latitude], radius]
        }}
    });
    res.status(200).json({
        success : true,
        results : jobs.length,
        data : jobs
    })
})

// Apply to job with resume
exports.applyJob = catchAsyncErrors(async(req,res,next) => {
    let job = await Job.findById(req.params.id);

    if(!job){
        return next(new ErrorHandler("Job not found", 404))
    }

    // Check job date
    if(job.lastDate < new Date(Date.now())){
        return next(new ErrorHandler("The date of this job is over",400))
    }

    // Check if user applied before
    for(let i=0;i<= job.applicantsApplied.length;i++){
        if(job.applicantsApplied[i].id === req.user.id){
            return next(new ErrorHandler('You have already applied for this job', 400))
        }
    }



    // Check files
    if(!req.files){
        return next(new ErrorHandler("Please upload the file",400))
    }
    const file = req.files.file

    const suportedFiles = /.docx|.pdf/;
    if(!suportedFiles.test(path.extname(file.name))){
        return next(new ErrorHandler("Please upload document file",400))
    }

    // Check document size
    if(file.size > process.env.MAX_FILE_SIZE){
        return next(new ErrorHandler("Please upload a file less than 2mb",400))
    }

    // renaming resume
    file.name = `${req.user.name.replace(' ', '_')}_${job._id}${file.name}.ext}`

    file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async err =>{
        if(err) {
            console.log(err)
            return next(new ErrorHandler("Resume Upload failed",500));
        }

        await Job.findByIdAndUpdate(req.params.id, {$push : {
            applicantsApplied : {
                id : req.user.id,
                resume : file.name
            }
        }}, {
            new : true,
            runValidators: true,
            useFindAndModify: false
        })
        res.status(200).json({
            success: true,
            message: "Applied to job succesfully",
            data: file.name
        })
    })

})