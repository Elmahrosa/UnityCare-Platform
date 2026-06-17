const MedicalRecord = require('../models/MedicalRecord');
const crypto = require('crypto');

exports.getStatus = async (req, res) => {
  const totalRecords = await MedicalRecord.countDocuments({ deletedAt: null });
  const hashedRecords = await MedicalRecord.countDocuments({
    deletedAt: null,
    integrityHash: { $exists: true, $ne: '' },
  });

  res.json({
    ok: true,
    network: 'private-hyperledger',
    status: 'operational',
    totalRecords,
    hashedRecords,
    verifiedRatio: totalRecords > 0
      ? Math.round((hashedRecords / totalRecords) * 100)
      : 0,
  });
};

exports.verifyRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      _id: req.params.recordId,
      deletedAt: null,
    }).populate('patient', 'name email');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    const computedHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        medications: record.medications,
        patient: record.patient?._id?.toString(),
      }))
      .digest('hex');

    const verified = record.integrityHash === computedHash;

    res.json({
      ok: true,
      recordId: record._id,
      storedHash: record.integrityHash || 'not_set',
      computedHash,
      verified,
      patientName: record.patient?.name,
      createdAt: record.createdAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
