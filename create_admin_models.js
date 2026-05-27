const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models', 'admin-models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const models = {
    'orgDetailsModel.js': `const mongoose = require('mongoose');

const orgDetailsSchema = new mongoose.Schema({
    org_code: { type: String, unique: true, required: true },
    org_name: { type: String, unique: true, required: true },
    org_type: { type: String },
    org_address: { type: String },
    privileges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'privileges' }],
    org_parent: { type: mongoose.Schema.Types.ObjectId },
    qbms_id: { type: Number },
    org_location: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('org_details', orgDetailsSchema);
`,
    'privilegesModel.js': `const mongoose = require('mongoose');

const privilegesSchema = new mongoose.Schema({
    p_name: { type: String, required: true },
    p_key_name: { type: String, required: true },
    p_id: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('privileges', privilegesSchema);
`,
    'orgRolesModel.js': `const mongoose = require('mongoose');

const orgRolesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    privileges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'privileges' }],
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true }
}, { timestamps: true });

module.exports = mongoose.model('org_roles', orgRolesSchema);
`,
    'orgAdminModel.js': `const mongoose = require('mongoose');

const orgAdminSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: Number },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    isSuperAdmin: { type: Boolean, default: false },
    full_name: { type: String },
    phoneno: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dob: { type: Date },
    uniqueno: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('org_admins', orgAdminSchema);
`,
    'User.js': `const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    full_name: { type: String },
    email: { type: String, unique: true, lowercase: true },
    phone: { type: String },
    username: { type: String, unique: true, lowercase: true },
    password: { type: String, required: true },
    dob: { type: Date },
    gender: { type: String },
    org_code: { type: String },
    orgId: { type: mongoose.Schema.Types.ObjectId },
    uniqueno: { type: String, unique: true },
    role: [{ type: mongoose.Schema.Types.ObjectId }],
    type: { type: String, enum: ['admin', 'faculty', 'student'] },
    system: { type: String, enum: ['OSM', 'TP', 'Scheduler'] }
}, { timestamps: true });

module.exports = mongoose.model('users', userSchema);
`,
    'schoolsModel.js': `const mongoose = require('mongoose');

const schoolsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
    address: { type: String },
    code: { type: String },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true }
}, { timestamps: true });

module.exports = mongoose.model('schools', schoolsSchema);
`,
    'programsModel.js': `const mongoose = require('mongoose');

const programsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String },
    duration: { type: Number },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true },
    credits: { type: String },
    scheme: { type: String, enum: ['Annual', 'Trimester', 'Semester'] }
}, { timestamps: true });

module.exports = mongoose.model('programs', programsSchema);
`,
    'departmentsModel.js': `const mongoose = require('mongoose');

const departmentsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true }
}, { timestamps: true });

module.exports = mongoose.model('departments', departmentsSchema);
`,
    'semestersModel.js': `const mongoose = require('mongoose');

const semestersSchema = new mongoose.Schema({
    no_of_semsisters: { type: String },
    location: { type: String },
    address: { type: String },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true }
}, { timestamps: true });

module.exports = mongoose.model('semesters', semestersSchema);
`,
    'coursesModel.js': `const mongoose = require('mongoose');

const coursesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String },
    credits: { type: String },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details', required: true }
}, { timestamps: true });

module.exports = mongoose.model('courses', coursesSchema);
`,
    'yearlyMasterModel.js': `const mongoose = require('mongoose');

const yearlyMasterSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'schools' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'programs' },
    batch: { type: String },
    batch_name: { type: String },
    academic_year: { type: String },
    term: { type: String },
    course_list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'courses' }],
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' }
}, { timestamps: true });

module.exports = mongoose.model('yearly_masters', yearlyMasterSchema);
`,
    'studentEnrolmentModel.js': `const mongoose = require('mongoose');

const studentEnrolmentSchema = new mongoose.Schema({
    academic_details: { type: mongoose.Schema.Types.ObjectId, ref: 'yearly_masters' },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'org_details' },
    student_ids: [{ type: mongoose.Schema.Types.ObjectId }]
}, { timestamps: true });

module.exports = mongoose.model('student_enrolments', studentEnrolmentSchema);
`,
    'facultyDirectoryModel.js': `const mongoose = require('mongoose');

const facultyDirectorySchema = new mongoose.Schema({
    academic_details: { type: mongoose.Schema.Types.ObjectId, ref: 'yearly_masters' },
    course_details: { type: mongoose.Schema.Types.ObjectId, ref: 'courses' },
    user_details: { type: mongoose.Schema.Types.ObjectId },
    role_details: [{ type: mongoose.Schema.Types.ObjectId, ref: 'org_roles' }]
}, { timestamps: true });

module.exports = mongoose.model('faculty_directories', facultyDirectorySchema);
`
};

for (const [filename, content] of Object.entries(models)) {
    fs.writeFileSync(path.join(modelsDir, filename), content);
    console.log('Created ' + filename);
}
