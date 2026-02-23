const requestService = require("./request.service");
const { success, error } = require("../../utils/responseHandler");

exports.createRequest = async (req, res) => {
  try {
    const request =
      await requestService.createRequest(req.body);

    success(
      res,
      "Thank you. Our admin will contact you shortly to confirm your appointment.",
      {
        requestId: request.requestId
      },
      201
    );
  } catch (err) {
    error(res, err.message);
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests =
      await requestService.getAllRequests();

    success(res, "Requests fetched", requests);
  } catch (err) {
    error(res, err.message);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const updated =
      await requestService.updateRequestStatus(
        req.params.requestId,
        req.body.status,
        req.user
      );

    success(res, "Request updated", updated);
  } catch (err) {
    error(res, err.message);
  }
};

exports.convertToPatientAppointment = async (req, res) => {
  try {
    const converted = await requestService.convertRequestToPatientAndAppointment(
      req.params.requestId,
      req.body,
      req.user
    );

    success(res, "Request converted to patient and appointment", converted, 201);
  } catch (err) {
    error(res, err.message);
  }
};
