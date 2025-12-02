import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { getAiInfo } from '../services/api';
import './AiInfoButton.css';

interface AiInfoButtonProps {
    fieldKey?: string;
    prompt?: string;
    title: string;
    staticText?: string;
}

const AiInfoButton: React.FC<AiInfoButtonProps> = ({ fieldKey, prompt, title, staticText }) => {
    const [showModal, setShowModal] = useState(false);
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCached, setIsCached] = useState(false);

    const fetchInfo = async (forceRefresh = false) => {
        if (staticText) {
            setContent(staticText);
            setShowModal(true);
            return;
        }

        if (!forceRefresh && content) {
            setShowModal(true);
            return;
        }

        if (!fieldKey || !prompt) {
            console.error('Missing fieldKey or prompt for AI fetch');
            return;
        }

        setIsLoading(true);
        setShowModal(true);
        try {
            const response = await getAiInfo(fieldKey, prompt, forceRefresh);
            setContent(response.content);
            setIsCached(response.cached);
        } catch (error) {
            console.error('Failed to fetch info', error);
            setContent('Não foi possível obter as informações no momento.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
    };

    return (
        <>
            <button
                type="button"
                className="info-icon"
                onClick={() => fetchInfo(false)}
                title={`Ver informações sobre ${title}`}
            >
                i
            </button>

            {showModal && (
                <div className="info-modal-overlay" onClick={handleClose}>
                    <div className="info-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="info-modal-header">
                            <h4>{title}</h4>
                            <button className="close-button-small" onClick={handleClose}>×</button>
                        </div>
                        <div className="info-modal-body">
                            {isLoading ? (
                                <div className="loading-spinner">Carregando informações...</div>
                            ) : (
                                <div className="ai-response-content">
                                    <ReactMarkdown>{content}</ReactMarkdown>
                                    {!staticText && (
                                        <div className="modal-footer-info">
                                            {isCached ? <span className="cache-badge">Cached</span> : <span></span>}
                                            <button className="reload-button" onClick={() => fetchInfo(true)} title="Atualizar informações">
                                                ↻ Atualizar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiInfoButton;
