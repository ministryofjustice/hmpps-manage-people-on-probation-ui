type Args = {
    crn: string
    appointmentId: string
    backlinkUri: string
}

export default class AddAppointmentNotePresenter {
    constructor(private readonly args: Args) {}

    get title(): string {
        return 'Add appointment note'
    }

    get backLinkArgs() {
        return {
            href: this.args.backlinkUri,
            text: 'Back to appointment',
        }
    }

    get crn(): string {
        return this.args.crn
    }

    get appointmentId(): string {
        return this.args.appointmentId
    }
}
