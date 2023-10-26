
export function NFTImageStub() {
	return require('app/assets/images/nft.png')
}

export function parseNFTImage(json_metadata, useStub = true) {
    if (json_metadata) {
        const meta = JSON.parse(json_metadata)
        if (meta && meta.image) return meta.image
    }
    if (!useStub) return null
    return NFTImageStub()
}
