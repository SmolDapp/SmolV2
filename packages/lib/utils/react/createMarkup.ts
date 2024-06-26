import {sanitize} from 'dompurify';

function createMarkup(dirty: string | Node): {__html: string} {
	return {__html: sanitize(dirty)};
}

export {createMarkup};
