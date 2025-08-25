# gamma_integration/api.py
# This file provides the API endpoints at the expected module path

from gamma_integration.gamma_integration.api import (
    create_gamma_proposal,
    sync_gamma_data,
    get_quotation_proposals,
    test_connection,
    link_existing_proposals
)

# Re-export all functions to make them available at gamma_integration.api
__all__ = [
    'create_gamma_proposal',
    'sync_gamma_data',
    'get_quotation_proposals',
    'test_connection',
    'link_existing_proposals'
]