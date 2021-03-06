import Milestone from "./Milestone";
import Dag from "../chain/Chain";

class Validator {
    milestone: Milestone;

    constructor(dag: Dag) {
        this.milestone = new Milestone(dag);
    }

    start() {
        this.milestone.start();
    }
}

export default Validator;
