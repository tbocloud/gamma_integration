// Global Gamma Integration functions

frappe.ui.form.on('Quotation', {
    refresh: function(frm) {
        add_gamma_buttons(frm);
        // Completely disable automatic display to prevent infinite loops
        console.log('Quotation refresh - automatic Gamma display disabled');
    },
    
    gamma_proposals: function(frm) {
        // Completely disable automatic refresh on child table changes
        console.log('Child table changed, but auto-refresh is disabled to prevent loops');
    },
    
    onload: function(frm) {
        // Reset all flags on load
        frm._gamma_initialized = false;
        frm._gamma_updating = false;
        frm._gamma_displaying = false;
        frm._gamma_refreshing = false;
        console.log('Quotation loaded - all Gamma flags reset');
    }
});

function add_gamma_buttons(frm) {
    // Add custom buttons for Gamma integration
    frm.add_custom_button(__('Create Gamma Proposal'), function() {
        create_gamma_proposal_dialog(frm);
    }, __('Gamma'));
    
    frm.add_custom_button(__('Display Proposals'), function() {
        display_gamma_proposals(frm);
    }, __('Gamma'));
    
    frm.add_custom_button(__('Sync All Proposals'), function() {
        sync_all_gamma_proposals(frm);
    }, __('Gamma'));
    
    frm.add_custom_button(__('Link Existing Proposals'), function() {
        link_existing_proposals(frm);
    }, __('Gamma'));
    
    // Add test button to verify API is working
    frm.add_custom_button(__('Test API'), function() {
        frappe.call({
            method: 'gamma_integration.gamma_integration.api.test_connection',
            callback: function(r) {
                if (r.message && r.message.status === 'success') {
                    frappe.show_alert({
                        message: r.message.message || 'API test successful',
                        indicator: 'green'
                    });
                } else {
                    frappe.show_alert({
                        message: 'API test failed',
                        indicator: 'red'
                    });
                }
            },
            error: function(r) {
                frappe.show_alert({
                    message: 'API connection failed',
                    indicator: 'red'
                });
                console.error('API Test Error:', r);
            }
        });
    }, __('Gamma'));
}

function create_gamma_proposal_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: 'Create Gamma Proposal',
        fields: [
            {
                fieldname: 'proposal_name',
                fieldtype: 'Data',
                label: 'Proposal Name',
                reqd: 1,
                default: `Proposal for ${frm.doc.customer || 'Customer'}`
            },
            {
                fieldname: 'proposal_type',
                fieldtype: 'Select',
                label: 'Proposal Type',
                options: 'Main Proposal\nTechnical Proposal\nFinancial Proposal\nExecutive Summary\nProduct Demo\nCase Study',
                default: 'Main Proposal'
            },
            {
                fieldname: 'gamma_url',
                fieldtype: 'Data',
                label: 'Gamma URL (Optional)',
                description: 'Paste existing Gamma presentation URL'
            }
        ],
        primary_action_label: 'Create',
        primary_action(values) {
            frappe.call({
                method: 'gamma_integration.gamma_integration.api.create_gamma_proposal',
                args: {
                    quotation_name: frm.doc.name,
                    proposal_name: values.proposal_name,
                    proposal_type: values.proposal_type
                },
                callback: function(r) {
                    if (r.message && r.message.status === 'success') {
                        frappe.show_alert({
                            message: r.message.message,
                            indicator: 'green'
                        });
                        
                        // If URL provided, sync it
                        if (values.gamma_url) {
                            frappe.call({
                                method: 'gamma_integration.gamma_integration.api.sync_gamma_data',
                                args: {
                                    gamma_proposal_name: r.message.gamma_proposal,
                                    gamma_url: values.gamma_url
                                },
                                callback: function(sync_r) {
                                    if (sync_r.message && sync_r.message.status === 'success') {
                                        frappe.show_alert({
                                            message: 'URL synced successfully',
                                            indicator: 'green'
                                        });
                                    }
                                }
                            });
                        }
                        
                        frm.reload_doc();
                    } else if (r.message && r.message.status === 'error') {
                        frappe.show_alert({
                            message: r.message.message || 'Error creating proposal',
                            indicator: 'red'
                        });
                    } else {
                        frappe.show_alert({
                            message: 'Unexpected response format',
                            indicator: 'orange'
                        });
                    }
                },
                error: function(r) {
                    frappe.show_alert({
                        message: 'Error creating proposal. Check console for details.',
                        indicator: 'red'
                    });
                    console.error('API Error:', r);
                }
            });
            dialog.hide();
        }
    });
    
    dialog.show();
}

function refresh_gamma_proposals(frm) {
    if (!frm.doc.name || frm._gamma_refreshing) {
        console.log('Refresh blocked - already refreshing or no document name');
        return;
    }
    
    frm._gamma_refreshing = true;
    console.log('Starting manual refresh of Gamma proposals');
    
    // Call the refresh API to ensure all proposals are linked
    frappe.call({
        method: 'gamma_integration.gamma_integration.api.refresh_quotation_gamma_display',
        args: {
            quotation_name: frm.doc.name
        },
        callback: function(r) {
            console.log('Refresh API completed - NOT reloading document to prevent loops');
            // Don't reload document to prevent infinite loops
            // Just display with current data
            frm._gamma_refreshing = false;
            setTimeout(() => {
                display_gamma_proposals(frm);
            }, 500);
        },
        error: function(r) {
            console.error('Error refreshing Gamma proposals:', r);
            frm._gamma_refreshing = false;
        }
    });
}

function display_gamma_proposals(frm) {
    if (frm._gamma_displaying || frm._gamma_refreshing) {
        console.log('Already displaying/refreshing Gamma proposals, skipping...');
        return;
    }
    
    frm._gamma_displaying = true;
    console.log('Displaying Gamma proposals...', frm.doc.gamma_proposals);
    
    // Check if we have the gamma_proposals_display field
    if (!frm.fields_dict.gamma_proposals_display) {
        console.log('gamma_proposals_display field not found');
        frm._gamma_displaying = false;
        return;
    }
    
    // Use child table data if available, otherwise fall back to API
    if (frm.doc.gamma_proposals && frm.doc.gamma_proposals.length > 0) {
        console.log('Using child table data:', frm.doc.gamma_proposals.length, 'proposals');
        let html = generate_proposals_html_from_table(frm.doc.gamma_proposals);
        frm.set_df_property('gamma_proposals_display', 'options', html);
        frm.refresh_field('gamma_proposals_display');
        frm._gamma_displaying = false;
    } else {
        console.log('No child table data, falling back to API call');
        // Only call API if we haven't already tried recently (reduced from 5s to 3s for better performance)
        if (!frm._last_api_call || (Date.now() - frm._last_api_call) > 3000) {
            frm._last_api_call = Date.now();
            frappe.call({
                method: 'gamma_integration.gamma_integration.api.get_quotation_proposals',
                args: {
                    quotation_name: frm.doc.name
                },
                callback: function(r) {
                    if (r.message && r.message.status === 'success') {
                        let proposals = r.message.proposals || [];
                        console.log('API returned:', proposals.length, 'proposals');
                        if (proposals.length === 0) {
                            show_empty_state(frm);
                        } else {
                            let html = generate_proposals_html(proposals);
                            frm.set_df_property('gamma_proposals_display', 'options', html);
                            frm.refresh_field('gamma_proposals_display');
                        }
                    } else {
                        console.log('API call failed or returned no data');
                        show_empty_state(frm);
                    }
                    frm._gamma_displaying = false;
                },
                error: function(r) {
                    console.error('Error in get_quotation_proposals:', r);
                    show_empty_state(frm);
                    frm._gamma_displaying = false;
                }
            });
        } else {
            console.log('API call throttled, showing empty state');
            show_empty_state(frm);
            frm._gamma_displaying = false;
        }
    }
}

function show_empty_state(frm) {
    let quotation_name = frm.doc.name || '';
    let empty_html = `
        <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px; margin: 15px 0;">
            <div style="font-size: 48px; color: #6c757d; margin-bottom: 15px;">📋</div>
            <h5 style="color: #6c757d; margin-bottom: 10px;">No Gamma Proposals</h5>
            <p style="color: #adb5bd; margin-bottom: 20px;">Click "Create Gamma Proposal" to add interactive presentations</p>
            <button class="btn btn-primary btn-sm" id="create-first-gamma-proposal" data-quotation="${quotation_name}">
                + Create First Proposal
            </button>
        </div>
    `;
    frm.set_df_property('gamma_proposals_display', 'options', empty_html);
    frm.refresh_field('gamma_proposals_display');
    
    // Add event listener after the HTML is rendered
    setTimeout(() => {
        const button = document.getElementById('create-first-gamma-proposal');
        if (button) {
            button.addEventListener('click', function() {
                const quotation = this.getAttribute('data-quotation');
                create_gamma_proposal_from_empty_state(quotation);
            });
        }
    }, 100);
}

function generate_proposals_html_from_table(proposals_table) {
    let html = '<div class="gamma-proposals-container" style="margin: 20px 0;">';
    html += '<h5 style="margin-bottom: 20px; color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">📊 Interactive Presentations</h5>';
    
    proposals_table.forEach((proposal_link, index) => {
        // Get the actual Gamma Proposal document data
        let primary_badge = proposal_link.is_primary ? '<span class="badge badge-success" style="margin-left: 8px;">Primary</span>' : '';
        let status_color = get_status_color(proposal_link.status || 'Draft');
        let proposal_name = proposal_link.gamma_proposal || ('Proposal ' + (index + 1));
        let proposal_type = proposal_link.proposal_type || 'Main';
        let proposal_status = proposal_link.status || 'Draft';
        
        // Build HTML using string concatenation to avoid template literal issues
        html += '<div class="gamma-proposal-card" style="margin-bottom: 25px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';
        
        // Header
        html += '<div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 15px; border-bottom: 1px solid #dee2e6;">';
        html += '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">';
        html += '<div style="flex: 1;">';
        html += '<h6 style="margin: 0 0 5px 0; color: #212529;">';
        html += proposal_name;
        html += primary_badge;
        html += '</h6>';
        html += '<small style="color: #6c757d;">';
        html += proposal_type + ' Proposal • ';
        html += '<span class="badge badge-' + status_color + '">' + proposal_status + '</span>';
        html += '</small>';
        html += '</div>';
        html += '<div style="margin-top: 10px;">';
        html += '<button class="btn btn-sm btn-warning" onclick="open_gamma_present(\'' + proposal_link.gamma_proposal + '\')" style="margin-right: 5px; color: white; font-weight: bold;">';
        html += 'Present';
        html += '</button>';
        html += '<button class="btn btn-sm btn-danger" onclick="open_gamma_pdf(\'' + proposal_link.gamma_proposal + '\')" style="margin-right: 8px; color: white; font-weight: bold;">';
        html += 'PDF';
        html += '</button>';
        html += '<button class="btn btn-sm btn-outline-secondary" onclick="open_gamma_editor(\'' + proposal_link.gamma_proposal + '\')" style="margin-right: 8px;">';
        html += '✏️ Edit';
        html += '</button>';
        html += '<button class="btn btn-sm btn-outline-primary" onclick="open_gamma_share(\'' + proposal_link.gamma_proposal + '\')" style="margin-right: 8px;">';
        html += '🔗 Share';
        html += '</button>';
        html += '<button class="btn btn-sm btn-outline-danger" onclick="unlink_gamma_proposal(\'' + proposal_link.gamma_proposal + '\', \'' + proposal_link.name + '\')">';
        html += '🗑️ Unlink';
        html += '</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        // Embedded Presentation - Auto-load and persist
        html += '<div style="position: relative; background: #f8f9fa;">';
        html += '<div id="gamma-embed-' + index + '" style="min-height: 500px; display: flex; align-items: center; justify-content: center;" data-proposal="' + proposal_link.gamma_proposal + '" data-loaded="false">';
        html += '<div style="text-align: center; color: #6c757d;">';
        html += '<div style="font-size: 24px; margin-bottom: 10px;">⏳</div>';
        html += '<div>Loading presentation...</div>';
        html += '<small style="display: block; margin-top: 10px;">';
        html += '<a href="#" onclick="load_gamma_embed(\'' + proposal_link.gamma_proposal + '\', ' + index + ')" class="text-primary">';
        html += 'Click to load presentation';
        html += '</a>';
        html += '</small>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        html += '</div>';
    });
    
    html += '</div>';
    
    // Add script to auto-load all presentations and make them persistent
    html += '<script>';
    html += 'setTimeout(function() {';
    html += 'if (typeof load_all_gamma_embeds === "function") {';
    html += 'load_all_gamma_embeds();';
    html += '}';
    html += '}, 1000);';
    html += '</script>';
    
    return html;
}

function generate_proposals_html(proposals) {
    let html = '<div class="gamma-proposals-container">';
    
    proposals.forEach((proposal) => {
        let primary_badge = proposal.is_primary ? '<span class="badge badge-success">Primary</span>' : '';
        let status_color = get_status_color(proposal.status);
        let proposal_name = proposal.proposal_name || 'Untitled Proposal';
        let proposal_type = proposal.proposal_type || 'Main';
        let proposal_status = proposal.status || 'Draft';
        
        html += `
            <div class="gamma-proposal-item" style="margin-bottom: 25px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
                <div class="proposal-header" style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h6 style="margin: 0;">
                                ${proposal_name}
                                ${primary_badge}
                                <span class="badge badge-${status_color}">${proposal_status}</span>
                            </h6>
                            <small class="text-muted">${proposal_type}</small>
                        </div>
                        <div class="proposal-actions">
                            ${proposal.gamma_embed_id ? `
                                <a href="https://gamma.app/docs/${proposal.gamma_embed_id}" target="_blank"
                                   class="btn btn-sm btn-outline-secondary" style="margin-right: 8px;">
                                    ✏️ Edit
                                </a>
                                <a href="https://gamma.app/public/${proposal.gamma_embed_id}" target="_blank"
                                   class="btn btn-sm btn-outline-primary">
                                    🔗 Share
                                </a>
                            ` : `
                                <small class="text-muted">No embed ID available</small>
                            `}
                        </div>
                    </div>
                </div>
                ${proposal.gamma_embed_id ? `
                    <div class="proposal-content">
                        <iframe src="https://gamma.app/embed/${proposal.gamma_embed_id}"
                                style="width: 100%; height: 500px; border: none;"
                                allowfullscreen
                                title="${proposal_name}">
                        </iframe>
                    </div>
                ` : `
                    <div class="proposal-content" style="padding: 20px; text-align: center;">
                        <p class="text-muted">Proposal created but not yet synced with Gamma</p>
                        <small>Use &quot;Sync All Proposals&quot; to update from Gamma</small>
                    </div>
                `}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function get_status_color(status) {
    const colors = {
        'Draft': 'secondary',
        'In Review': 'warning',
        'Shared': 'info',
        'Approved': 'success',
        'Rejected': 'danger'
    };
    return colors[status] || 'light';
}

function sync_all_gamma_proposals(frm) {
    frappe.show_alert({
        message: 'Syncing all Gamma proposals...',
        indicator: 'blue'
    });
    
    // Use the controlled refresh mechanism
    refresh_gamma_proposals(frm);
}
// Helper functions for Gamma embed loading and interaction
function load_gamma_embed(proposal_name, index) {
    if (!proposal_name) {
        console.error('No proposal name provided');
        return;
    }
    
    let container = document.getElementById(`gamma-embed-${index}`);
    if (!container) return;
    
    // Check if already loaded
    if (container.getAttribute('data-loaded') === 'true') {
        console.log('Presentation already loaded for', proposal_name);
        return;
    }
    
    // Get the Gamma Proposal document to fetch the embed ID
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Gamma Proposal',
            name: proposal_name
        },
        callback: function(r) {
            if (r.message && r.message.gamma_embed_id) {
                let embed_id = r.message.gamma_embed_id;
                
                container.innerHTML = `
                    <iframe src="https://gamma.app/embed/${embed_id}"
                            style="width: 100%; height: 500px; border: none; opacity: 0; transition: opacity 0.3s;"
                            allowfullscreen
                            loading="lazy"
                            title="${r.message.proposal_name || 'Gamma Proposal'}"
                            onload="this.style.opacity=1">
                    </iframe>
                `;
                
                // Mark as loaded to persist
                container.setAttribute('data-loaded', 'true');
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #6c757d;">
                        <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                        <div>No embed ID available</div>
                        <small style="display: block; margin-top: 10px;">
                            Please sync this proposal with Gamma
                        </small>
                    </div>
                `;
            }
        },
        error: function(r) {
            console.error('Error loading Gamma proposal:', r);
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
                    <div>Error loading proposal</div>
                </div>
            `;
        }
    });
}

// Load all gamma embeds automatically
function load_all_gamma_embeds() {
    const containers = document.querySelectorAll('[id^="gamma-embed-"]');
    containers.forEach((container, index) => {
        const proposal_name = container.getAttribute('data-proposal');
        if (proposal_name && container.getAttribute('data-loaded') !== 'true') {
            setTimeout(() => {
                load_gamma_embed(proposal_name, index);
            }, index * 500); // Stagger loading to avoid overwhelming
        }
    });
}

function open_gamma_editor(proposal_name) {
    if (!proposal_name) {
        frappe.show_alert({
            message: 'No proposal selected',
            indicator: 'red'
        });
        return;
    }
    
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Gamma Proposal',
            name: proposal_name
        },
        callback: function(r) {
            if (r.message && r.message.gamma_embed_id) {
                let edit_url = `https://gamma.app/docs/${r.message.gamma_embed_id}`;
                window.open(edit_url, '_blank');
            } else {
                frappe.show_alert({
                    message: 'No Gamma URL available for this proposal',
                    indicator: 'orange'
                });
            }
        }
    });
}

function open_gamma_share(proposal_name) {
    if (!proposal_name) {
        frappe.show_alert({
            message: 'No proposal selected',
            indicator: 'red'
        });
        return;
    }
    
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Gamma Proposal',
            name: proposal_name
        },
        callback: function(r) {
            if (r.message && r.message.gamma_embed_id) {
                let share_url = `https://gamma.app/public/${r.message.gamma_embed_id}`;
                window.open(share_url, '_blank');
            } else {
                frappe.show_alert({
                    message: 'No Gamma URL available for this proposal',
                    indicator: 'orange'
                });
            }
        }
    });
}

function open_gamma_present(proposal_name) {
    if (!proposal_name) {
        frappe.show_alert({
            message: 'No proposal selected',
            indicator: 'red'
        });
        return;
    }
    
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Gamma Proposal',
            name: proposal_name
        },
        callback: function(r) {
            if (r.message && r.message.gamma_embed_id) {
                // Open in presentation mode (fullscreen)
                let present_url = `https://gamma.app/public/${r.message.gamma_embed_id}?mode=present`;
                window.open(present_url, '_blank', 'fullscreen=yes,scrollbars=no,resizable=no');
                
                frappe.show_alert({
                    message: 'Opening presentation in fullscreen mode',
                    indicator: 'green'
                });
            } else {
                frappe.show_alert({
                    message: 'No Gamma URL available for this proposal',
                    indicator: 'orange'
                });
            }
        }
    });
}

function open_gamma_pdf(proposal_name) {
    if (!proposal_name) {
        frappe.show_alert({
            message: 'No proposal selected',
            indicator: 'red'
        });
        return;
    }
    
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Gamma Proposal',
            name: proposal_name
        },
        callback: function(r) {
            if (r.message && r.message.gamma_embed_id) {
                // Open PDF export URL
                let pdf_url = `https://gamma.app/public/${r.message.gamma_embed_id}/pdf`;
                window.open(pdf_url, '_blank');
                
                frappe.show_alert({
                    message: 'Opening PDF export - download will start automatically',
                    indicator: 'blue'
                });
            } else {
                frappe.show_alert({
                    message: 'No Gamma URL available for this proposal',
                    indicator: 'orange'
                });
            }
        }
    });
}

function unlink_gamma_proposal(proposal_name, link_name) {
    if (!proposal_name || !link_name) {
        frappe.show_alert({
            message: 'Invalid proposal or link information',
            indicator: 'red'
        });
        return;
    }
    
    frappe.confirm(
        `Are you sure you want to unlink the Gamma proposal "${proposal_name}" from this quotation?`,
        function() {
            // Delete the link record
            frappe.call({
                method: 'frappe.client.delete',
                args: {
                    doctype: 'Quotation Gamma Proposal',
                    name: link_name
                },
                callback: function(r) {
                    frappe.show_alert({
                        message: 'Gamma proposal unlinked successfully',
                        indicator: 'green'
                    });
                    
                    // Refresh the display
                    let frm = frappe.ui.form.get_open_form();
                    if (frm) {
                        frm.reload_doc().then(() => {
                            display_gamma_proposals(frm);
                        });
                    }
                },
                error: function(r) {
                    frappe.show_alert({
                        message: 'Error unlinking proposal: ' + (r.message || 'Unknown error'),
                        indicator: 'red'
                    });
                    console.error('Unlink error:', r);
                }
            });
        }
    );
}

// Disable automatic refresh on child table changes to prevent infinite loops
// Users must manually refresh using the "Sync All Proposals" button
frappe.ui.form.on('Quotation Gamma Proposal', {
    gamma_proposal: function(frm, cdt, cdn) {
        console.log('Gamma proposal changed - manual refresh required');
        frappe.show_alert({
            message: 'Gamma proposal updated. Click "Sync All Proposals" to refresh display.',
            indicator: 'blue'
        });
    },
    
    status: function(frm, cdt, cdn) {
        console.log('Status changed - manual refresh required');
    },
    
    is_primary: function(frm, cdt, cdn) {
        console.log('Primary status changed - manual refresh required');
    }
});
function link_existing_proposals(frm) {
    frappe.show_alert({
        message: 'Linking existing Gamma proposals...',
        indicator: 'blue'
    });
    
    frappe.call({
        method: 'gamma_integration.gamma_integration.api.link_existing_proposals',
        callback: function(r) {
            if (r.message && r.message.status === 'success') {
                frappe.show_alert({
                    message: r.message.message,
                    indicator: 'green'
                });
                
                // Use the new refresh mechanism
                refresh_gamma_proposals(frm);
            } else {
                frappe.show_alert({
                    message: r.message?.message || 'Error linking proposals',
                    indicator: 'red'
                });
            }
        },
        error: function(r) {
            frappe.show_alert({
                message: 'Error linking existing proposals',
                indicator: 'red'
            });
            console.error('Link Existing Proposals Error:', r);
        }
    });
}

// Function to handle empty state button click
function create_gamma_proposal_from_empty_state(quotation_name) {
    if (!quotation_name) {
        frappe.show_alert({
            message: 'No quotation selected',
            indicator: 'red'
        });
        return;
    }
    
    // Get the current form
    let frm = frappe.ui.form.get_open_form();
    if (frm && frm.doc.name === quotation_name) {
        create_gamma_proposal_dialog(frm);
    } else {
        frappe.show_alert({
            message: 'Please refresh the form and try again',
            indicator: 'orange'
        });
    }
}

// Make function globally available
window.create_gamma_proposal_from_empty_state = create_gamma_proposal_from_empty_state;