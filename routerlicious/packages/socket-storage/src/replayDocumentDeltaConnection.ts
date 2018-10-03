import {
    IDocumentDeltaConnection,
    IDocumentMessage,
    ISequencedDocumentMessage,
    IUser,
} from "@prague/runtime-definitions";
import * as api from "@prague/runtime-definitions";
import { EventEmitter } from "events";
import * as messages from "./messages";

// Simulated delay interval for emitting the ops
const DelayInterval = 50;

export class ReplayDocumentDeltaConnection extends EventEmitter implements IDocumentDeltaConnection {
    public static async Create(
        tenantId: string,
        id: string,
        token: string,
        storageService: api.IDeltaStorageService,
        replayFrom: number,
        replayTo: number,
       ): Promise<IDocumentDeltaConnection> {

        const connection = {user: null, clientId: "", existing: true, parentBranch: null, initialMessages: []};
        const deltaConnection = new ReplayDocumentDeltaConnection(id, connection);
        this.FetchAndEmitOps(deltaConnection, tenantId, id, token, storageService, replayFrom, replayTo);

        return deltaConnection;
    }
    private static async FetchAndEmitOps(
        deltaConnection: ReplayDocumentDeltaConnection,
        tenantId: string,
        id: string,
        token: string,
        storageService: api.IDeltaStorageService,
        replayFrom: number,
        replayTo: number,
    ) {
        const fetchedOps = await storageService.get(tenantId, id, token, 0, replayTo );
        let current = 0;
        let playbackOps: ISequencedDocumentMessage[] = [];
        if (fetchedOps.length > 0 && replayFrom > 0) {
            // If the requested playback range is not from 0, emit all the
            // ops from 0 to from immediately
            playbackOps.push(...fetchedOps.slice(current, replayFrom));
            current = replayFrom;
            deltaConnection.emit("op", id, playbackOps);
        }
        const intervalHandle = setInterval(() => {
            // Emit the ops from replay to the end every "deltainterval" milliseconds
            // to simulate the socket stream
            if (current < fetchedOps.length) {
                playbackOps = [];
                playbackOps.push(fetchedOps[current]);
                current += 1;
                deltaConnection.emit("op", id, playbackOps);
            } else {
                clearInterval(intervalHandle);
            }
        }, DelayInterval);
    }

    public get clientId(): string {
        return this.details.clientId;
    }

    public get existing(): boolean {
        return this.details.existing;
    }

    public get parentBranch(): string {
        return this.details.parentBranch;
    }

    public get user(): IUser {
        return this.details.user;
    }

    public get initialMessages(): ISequencedDocumentMessage[] {
        return this.details.initialMessages;
    }

    constructor(
        public documentId: string,
        public details: messages.IConnected,
        ) {
        super();
    }

    public submit(message: IDocumentMessage): void {
        console.log("dropping the outbound message");
    }

    public disconnect() {
        console.log("no implementation for disconnect...");
    }
}
