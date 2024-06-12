import type {ReactElement} from 'react';

function SwapAppInfo(): ReactElement {
	return (
		<div>
			<div className={'my-4 aspect-video overflow-hidden rounded-lg bg-neutral-200'}>
				<video
					autoPlay
					loop
					muted
					playsInline
					className={'aspect-video cursor-pointer rounded-lg'}
					onClick={(e): void => {
						const video = e.currentTarget;
						video.pause();

						//clone video
						const clonedVideo = video.cloneNode(true) as HTMLVideoElement;
						clonedVideo.currentTime = video.currentTime;
						clonedVideo.style.position = 'fixed';
						clonedVideo.style.left = '50%';
						clonedVideo.style.top = '20%';
						clonedVideo.style.width = '60vw';
						clonedVideo.style.transform = 'translateX(-50%)';
						clonedVideo.style.zIndex = '1000001';
						clonedVideo.style.cursor = 'pointer';
						clonedVideo.id = 'backdrop-content';
						clonedVideo.onclick = (e): void => {
							backdrop.remove();
							clonedVideo.remove();
							video.currentTime = (e.currentTarget as HTMLVideoElement).currentTime;
							video.play();
						};

						const backdrop = document.createElement('div');
						backdrop.style.position = 'fixed';
						backdrop.style.top = '0';
						backdrop.style.left = '0';
						backdrop.style.width = '100%';
						backdrop.style.height = '100%';
						backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
						backdrop.style.zIndex = '1000000';
						backdrop.style.cursor = 'pointer';
						backdrop.id = 'backdrop';
						backdrop.onclick = (): void => {
							video.currentTime = clonedVideo.currentTime;
							backdrop.remove();
							clonedVideo.remove();
							video.play();
						};
						document.body?.prepend(clonedVideo);
						document.body?.prepend(backdrop);
					}}
					style={{maxWidth: '100%'}}>
					<source
						src={'/smol-swap.mp4'}
						type={'video/mp4'}
					/>
				</video>
			</div>
			<div>
				<div className={'mb-4 h-px w-full bg-neutral-300'} />
				<p className={'text-sm text-neutral-900'}>{'Smol Swap is powered by Li.Fi'}</p>
				<p className={'text-sm'}>
					{'It allows you to swap tokens on the same chain, or across different chains. '}
				</p>
				<p className={'text-sm'}>
					{'You can even use it like a bridge by swapping to the same token on your destination chain. '}
				</p>
				<br />
				<p className={'text-sm text-neutral-900'}>{'Using Smol Swap is simple.'}</p>
				<div className={'mt-2'}>
					<p className={'text-sm font-medium'}>{'Step 1:'}</p>
					<p className={'pl-4 text-sm'}>{'Select the network you want to swap tokens from.'}</p>
					<br />

					<p className={'text-sm font-medium'}>{'Step 2:'}</p>
					<p className={'pl-4 text-sm'}>{'Select the token you want to swap from.'}</p>
					<br />

					<p className={'text-sm font-medium'}>{'Step 3:'}</p>
					<p className={'pl-4 text-sm'}>{'Select the network you want to receive the swapped token on.'}</p>
					<br />

					<p className={'text-sm font-medium'}>{'Step 4:'}</p>
					<p className={'pl-4 text-sm'}>
						{'Select the token you want to receive after the swap has been executed.'}
					</p>
					<p className={'pl-4 text-sm'}>
						{'For example you might want to swap DAI on Ethereum to USDC on Base. Fancy!'}
					</p>
				</div>

				<br />
				<p className={'text-sm text-neutral-900'}>{'Surprise, more tokens!'}</p>
				<p className={'text-sm'}>
					{
						"Smol swap will always display the MINIMUM amount of tokens you'll receieve. So you might end up with extra tokens - it's like a bonus but you didn't have to laugh at your bosses jokes."
					}
				</p>
				<br />
				<p className={'text-sm text-neutral-900'}>{'We have a fee'}</p>
				<p className={'text-sm'}>{'Smol charges a 0.3% fee on swaps to fund starving devs. Ty'}</p>
			</div>
		</div>
	);
}

export {SwapAppInfo};
