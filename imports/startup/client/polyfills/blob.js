import { Blob } from 'blob-polyfill';

if (!('Blob' in window)) {
	window.Blob = Blob;
}
