import { IDocumentService, IErrorTrackingService } from "@prague/runtime-definitions";
import { DocumentService } from "./documentService";
import { DefaultErrorTracking } from "./errorTracking";
import { ReplayDocumentService } from "./replayDocumentService";

export function createDocumentService(
    deltaUrl: string,
    gitUrl: string,
    errorTracking: IErrorTrackingService = new DefaultErrorTracking(),
    disableCache = false,
    historianApi = true,
    credentials?): IDocumentService {

    const service = new DocumentService(
        deltaUrl,
        gitUrl,
        errorTracking,
        disableCache,
        historianApi,
        credentials);

    return service;
}

export function createReplayDocumentService(
    deltaUrl: string,
    replayFrom: number,
    replayTo: number,
    ): IDocumentService {

    const service = new ReplayDocumentService(
        deltaUrl, replayFrom, replayTo);

    return service;
}
