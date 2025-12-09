export function getDbErrorCode(error: any) {
    return error?.cause?.code as string | undefined;
}