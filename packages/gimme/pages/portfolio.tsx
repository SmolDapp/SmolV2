import {Fragment, type ReactElement} from 'react';
import {Portfolio} from '@gimmmeSections/Portfolio';

function PortfolioPage(): ReactElement {
	return <Portfolio />;
}

PortfolioPage.getLayout = function getLayout(page: ReactElement): ReactElement {
	return <Fragment>{page}</Fragment>;
};

export default PortfolioPage;
