class ApiResponse {
    constructor(statusCode, message = "Success", data) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode<400;
    }       
}

export default ApiResponse;